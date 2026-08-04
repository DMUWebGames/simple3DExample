performance.mark('space-scene-module');

import { EntityFramework } from "../Engine/ECS/Framework.js";
import { device } from "../setup.js";
import { cubeVertices, cubeVertexBuffer } from "../cube.js";
import { sphericalVertices } from "../sphere.js";
import { identityQuat, randomDirection, randomQuat, randomQuatBetween, randomVector } from "../tools.js";
import { loadMaterial } from "../material.js";
import { cameraScript } from "../../scripts/camera.js";
import { GPUBufferManager } from "../Engine/GPUBuffers.js";
import { ResourceRegistry } from "../Engine/ResourceRegistry.js";
import { CommandQueue } from "../Engine/CommandQueue.js";
import { Scene } from "../Engine/scene.js";

// Systems
import { AccelerationSystem } from "../Engine/systems/acceleration.js";
import { TorqueSystem } from "../Engine/systems/torque.js";
import { ForceSystem } from "../Engine/systems/force.js";
import { GravitySystem } from "../Engine/systems/gravity.js";
import { LocalForceSystem } from "../Engine/systems/localForce.js";
import { MovementSystem } from "../Engine/systems/movement.js";
import { RotationSystem } from "../Engine/systems/rotation.js";
import { LightingSystem } from "../Engine/systems/lighting.js";
import { CameraSystem } from "../Engine/systems/camera.js";
import { Renderer } from "../Engine/systems/renderer.js";
import { TransformSystem } from "../Engine/systems/transform.js";
import { ScriptingSystem } from "../Engine/systems/scripts.js";

const crateMaterial = await loadMaterial("materials/crate.json");
const asteroidMaterial = await loadMaterial("materials/asteroid.json");
const skyBoxMaterial = await loadMaterial("materials/skybox.json");

performance.mark('space-scene-assets-loaded');
performance.measure('space-scene-assets', 'space-scene-module', 'space-scene-assets-loaded');


export class SpaceScene extends Scene {
    constructor(canvas, { size, nCrates, nAsteroids }) {
        performance.mark('start-space-scene');

        super(canvas, {
            maxEntities: nCrates + nAsteroids + 1 + 1 + 1, // camera, skybox, light
            components: {
                Position: [0, 0, 0],
                Velocity: [0, 0, 0],
                Force: [0, 0, 0],
                Thrust: [0, 0, 0],
                Orientation: [0, 0, 0, 0],
                AngularVelocity: [0, 0, 0],
                Torque: [0, 0, 0],
                Mass: 0,
                Scale: [1, 1, 1],
                Transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
                Renderable: 0,
                Scriptable: { scriptId: 0, argumentId: 0 },
                Camera: { near: 0, far: 0, fov: 0, _pad: 0 },
                RenderCamera: { viewProjMatrix: Array(16).fill(0), position: Array(3).fill(0) }
            }
        });
        
        this.size = size;
       
        this.createVertexBuffers();
        this.createEntities({ nCrates, nAsteroids });
        this.createUniformBuffers();

        // set up scripts
        const scripts = [cameraScript]
        const scriptData = [{
            torque: [-0.25, -0.25, -2],
            thrust: -150,
            brake: -100
        }]

        this.createBuffers();

        const ctx = this.ctx;

        // Layers
        this.addLayer("scripts", [
            new ScriptingSystem(scripts, scriptData)
        ]);

        this.addLayer("physics", [
            // new GravitySystem(ctx),
            new LocalForceSystem(ctx),
            new ForceSystem(ctx),
            new TorqueSystem(ctx)
        ]);

        this.addLayer("simulation", [
            new MovementSystem(ctx),
            new RotationSystem(ctx),
            new TransformSystem(ctx),
        ]);
        this.addLayer("render", [
            new CameraSystem(ctx),
            // new LightingSystem(ctx),
            new Renderer(ctx)
            // new ConcreteRenderer(ctx)
        ]);

        performance.mark('space-scene-configured');
        performance.measure('space-scene-initialisation', 'start-space-scene', 'space-scene-configured');

    }

    createEntities({ nAsteroids, nCrates }) {

        this.background = this.world.createEntity();
        this.world.addComponent(this.background, "Renderable", this.skyBoxRenderableId);
        this.world.addComponent(this.background, "Scale", [this.size, this.size, this.size]);
        this.world.addComponent(this.background, "Mass", 0.1);
        this.world.addComponent(this.background, "Position", [0, 0, 0]);
        this.world.addComponent(this.background, "Orientation", identityQuat());
        this.world.addComponent(this.background, "Velocity", [0, 0, 0]);
        this.world.addComponent(this.background, "AngularVelocity", [0, 0, 0]);
        this.world.addComponent(this.background, "Force", [0, 0, 0]);
        this.world.addComponent(this.background, "Torque", [0, 0, 0]);
        this.world.addComponent(this.background, "Transform", Array(16).fill(0));


        // Camera
        this.cameraId = this.cameraEntity({
            Size: 10, 
            Mass: 10,
            Orientation: identityQuat(),
            Position: [0, 0, 0],
            Camera: {
                near: 1,
                far: this.size * 2,
                fov: 60
            }
        })

        new Array(nCrates).fill(0).forEach(() => {
            const id = this.crateEntity({
                Size: 10,
                Mass: 1000,
                Position: randomVector(-this.size, this.size),
                Velocity: randomVector(-100, 100)
            });
        });

        new Array(nAsteroids).fill(0).forEach(() => {
            const Size = 5 + Math.random() * 10;
            const id = this.asteroidEntity({
                Size,
                Mass: Size * 10000000,
                Position: randomVector(-this.size, this.size),
                Velocity: randomVector(-.1, .1)
            });
        });

    }

    createEntity(components) {
        const id = this.world.createEntity();
        for (const [key, value] of Object.entries(components)) {
            this.world.addComponent(id, key, value);
        }
        return id;
    }

    baseEntity({Scale, Position, Orientation, Mass, Velocity, AngularVelocity}) {
        return this.createEntity({
            Scale, Position, Orientation, Mass, Velocity, AngularVelocity,
            Force: [0, 0, 0],
            Torque: [0, 0, 0],
            Transform: Array(16).fill(0)
        })
    }

    crateEntity({ Size, Mass, Position, Velocity }) { 
        const id = this.baseEntity({
            Scale: Array(3).fill(Size),
            Position,
            Orientation: randomQuat(),
            Mass,
            Velocity,
            AngularVelocity: randomVector(-1, 1)
        });
        this.world.addComponent(id, "Renderable", this.crateRenderableId);
        return id;
    }

    asteroidEntity({ Size, Mass, Position, Velocity }) {
        const id = this.baseEntity({
            Scale: Array(3).fill(Size),
            Position,
            Orientation: randomQuat(),
            Mass,
            Velocity,
            AngularVelocity: randomVector(-.1, .1),
        });
        this.world.addComponent(id, "Renderable", this.asteroidRenderableId);
        return id;
    }

    cameraEntity({Size, Position, Orientation, Mass, Camera }) {
        const id = this.baseEntity({
            Scale: Array(3).fill(Size),
            Position,
            Orientation,
            Mass,
            Velocity: [0, 0, 0],
            AngularVelocity: [0, 0, 0]
        });
        this.world.addComponent(id, "Camera", Camera);
        this.world.addComponent(id, "Thrust", [0, 0, 0]);
        this.world.addComponent(id, "Scriptable", [0, 0]);
        this.world.addComponent(id, "RenderCamera", { viewProjMatrix: Array(16).fill(0), position: Array(3).fill(0) });
        return id;
    }

    backgroundEntity({size}) {
        const id = this.baseEntity({
            Scale: Array(3).fill(size),
            Position: [0, 0, 0],
            Orientation: [0, 0, 0],
            Mass: 1,
            Velocity: [0, 0, 0],
            AngularVelocity: [0, 0, 0]
        });
        this.world.addComponent(id, "Renderable", this.skyBoxRenderableId);
        return id;
    }

    createVertexBuffers() { 
        // Vertex buffers
        this.buffers.createVertex({
            label: "cube vertices",
            data: cubeVertices,
            length: cubeVertices.length / 8
        });

        const mySphericalVertices = sphericalVertices(20, 1);
        this.buffers.createVertex({
            label: "sphere vertices",
            data: mySphericalVertices,
            length: mySphericalVertices.length / 8
        });
        
        // Rendering data for Crates
        this.crateRenderableId = this.renderables.set("crate", {
            vertexBuffer: this.buffers.get("cube vertices"),
            vertexCount: cubeVertices.length / 8,
            material: crateMaterial
        });
        
        // Rendering data for Asteroids
        this.asteroidRenderableId = this.renderables.set("asteroid", {
            vertexBuffer: this.buffers.get("sphere vertices"),
            vertexCount: mySphericalVertices.length / 8,
            material: asteroidMaterial
        });

        // Rendering data for the background
        this.skyBoxRenderableId = this.renderables.set("background", {
            vertexBuffer: this.buffers.get("sphere vertices"),
            vertexCount: mySphericalVertices.length / 8,
            material: skyBoxMaterial
        });





    }

    createBuffers() { 


        // Storage buffers for all components
        this.buffers.createFromWorld(this.world);
        this.buffers.indexBy(this.world, "Renderable", 0);

    }

    createUniformBuffers() { 
        this.buffers.createUniform({
            label: "size",
            data: new Float32Array([this.size])
        });

        this.buffers.createUniform({
            label: "gravityConfig",
            data: new Float32Array([10000, 10, this.size, 0])
        });

        this.buffers.createUniform({
            label: "phongLight",
            data: new Float32Array([
                ...randomDirection(),       // direction
                0,                          // pad
                0.9 + 0.1 * Math.random(),  // R
                0.9 + 0.1 * Math.random(),  // G
                0.9 + 0.1 * Math.random(),  // B
                0                           // pad
            ])
        });


        this.buffers.createUniform({
            label: "activeCamera",
            data: new Uint32Array([this.cameraId])
        });

    }

    get ctx() {
        return {
            buffers: this.buffers,
            world: this.world,
            renderables: this.renderables,
            misc: this.misc,
            input: this.input,
            activeEntities: this.world.getActive(),
            commands: this.commands,
            canvas: this.canvas,
            device
        }
    }

    update(deltaTime) {
        performance.mark(`${this.constructor.name} start`);
        const ctx = this.ctx;
        this.layers.get("scripts").update(ctx);
        this.commands.flush(ctx);
        this.layers.get("physics").update(ctx);
        this.layers.get("simulation").update(ctx);
        this.layers.get("render").update(ctx);
        performance.mark(`${this.constructor.name} complete`);
        performance.measure(`${this.constructor.name} update`, `${this.constructor.name} start`, `${this.constructor.name} complete`);
    }



}
