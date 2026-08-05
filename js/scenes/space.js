performance.mark('space-scene-module');

import { device } from "../setup.js";
// import { cubeVertices } from "../cube.js";
// import { sphericalVertices } from "../sphere.js";
import { identityQuat, randomDirection, randomQuat, randomVector } from "../tools.js";
import { loadMaterial } from "../material.js";
import { cameraScript } from "../../scripts/camera.js";
import { Scene } from "../Engine/scene.js";

// Systems
import { TorqueSystem } from "../Engine/systems/torque.js";
import { ForceSystem } from "../Engine/systems/force.js";
import { GravitySystem } from "../Engine/systems/gravity.js";
import { LocalForceSystem } from "../Engine/systems/localForce.js";
import { MovementSystem } from "../Engine/systems/movement.js";
import { RotationSystem } from "../Engine/systems/rotation.js";
import { CameraSystem } from "../Engine/systems/camera.js";
import { Renderer } from "../Engine/systems/renderer.js";
import { TransformSystem } from "../Engine/systems/transform.js";
import { ScriptingSystem } from "../Engine/systems/scripts.js";
import { loadVertices } from "../mesh.js";

const crateMaterial = await loadMaterial("materials/crate.json");
const asteroidMaterial = await loadMaterial("materials/asteroid.json");
const skyBoxMaterial = await loadMaterial("materials/skybox.json");

performance.mark('space-scene-assets-loaded');
performance.measure('space-scene-assets', 'space-scene-module', 'space-scene-assets-loaded');

const crateVertices = await loadVertices('meshes/cube.json');
const asteroidVertices = await loadVertices('meshes/sphere_20.json');
const skyBoxVertices = await loadVertices('meshes/sphere_50.json');


export class SpaceScene extends Scene {
    constructor(canvas, { size, nCrates, nAsteroids, asteroidSize }) {
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
        this.createEntities({ nCrates, nAsteroids, asteroidSize });
        this.createUniformBuffers();
        this.createInstanceBuffers();

        // set up scripts
        const scripts = [cameraScript]
        const scriptData = [{
            torque: [-0.25, -0.25, -2],
            thrust: -150,
            brake: -100
        }]


        const ctx = this.ctx;

        // Layers
        this.addLayer("scripts", [new ScriptingSystem(scripts, scriptData)]);

        this.addLayer("physics", [
            new GravitySystem(ctx),
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
            new Renderer(ctx)
        ]);

        performance.mark('space-scene-configured');
        performance.measure('space-scene-initialisation', 'start-space-scene', 'space-scene-configured');

    }

    createEntities({ nAsteroids, nCrates, asteroidSize }) {

        this.skyBoxId = this.skyBoxEntity({ size: this.size });
        this.cameraId = this.cameraEntity({
            Size: -10, 
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
            const Size = asteroidSize.min + Math.random() * (asteroidSize.max - asteroidSize.min);
            const id = this.asteroidEntity({
                Size,
                Mass: Size * 100000,
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

    skyBoxEntity({ size }) {
        const id = this.baseEntity({
            Scale: Array(3).fill(size),
            Position: [0, 0, 0],
            Orientation: identityQuat(),
            Mass: 0.1,
            Velocity: [0, 0, 0],
            AngularVelocity: [0, 0, 0]
        });
        this.world.addComponent(id, "Renderable", this.skyBoxRenderableId);
        return id;
    }

    createVertexBuffers() { 
        this.crateRenderableId = this.addRenderable(
            "crate",
            crateVertices,
            crateMaterial,
            {stride: 8}
        )

        this.asteroidRenderableId = this.addRenderable(
            "asteroid",
            asteroidVertices,
            asteroidMaterial,
            {stride: 8}
        )

        this.skyBoxRenderableId = this.addRenderable(
            "skybox",
            skyBoxVertices,
            skyBoxMaterial,
            {stride: 8}
        )
    }

    createInstanceBuffers() { 
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
            data: new Float32Array([
                10,                     // G
                1,                      // minDistance
                this.size / 50,        // maxDistance
                0                       // pad
            ])
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
