performance.mark('space-scene-module');

import { identityQuat, randomDirection, randomQuat, randomVector } from "../tools.js";
import { loadMaterial } from "../material.js";
import { cameraScript } from "../../scripts/camera.js";
import { Scene } from "../Engine/scene.js";
import { loadVertices } from "../mesh.js";

// Systems
import { Renderer } from "../Engine/systems/renderer.js";
import { ScriptingSystem } from "../Engine/systems/scripts.js";

const crateMaterial = await loadMaterial("crate");
const asteroidMaterial = await loadMaterial("asteroid");
const skyBoxMaterial = await loadMaterial("skybox");


const crateVertices = await loadVertices('./data/meshes/cube.json');
const asteroidVertices = await loadVertices('./data/meshes/sphere_20.json');
const skyBoxVertices = await loadVertices('./data/meshes/sphere_50.json');

performance.mark('space-scene-assets-loaded');
performance.measure('space-scene-assets', 'space-scene-module', 'space-scene-assets-loaded');

export class SpaceScene extends Scene {

    constructor(device, canvas, { size, nCrates, nAsteroids, asteroidSize, layers, models, components}) {
        performance.mark('start-space-scene');
        super(device, canvas, {
            maxEntities: nCrates + nAsteroids + 1 + 1 + 1,
            components
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
        this.scripts = new ScriptingSystem(scripts, scriptData);

        // Layers
        const ctx = this.ctx;

        this.addLayers(layers);

        //     new GravitySystem(ctx),
        this.renderer = new Renderer(ctx);
        this.addLayer("render", [this.renderer]);

        performance.mark('space-scene-configured');
        performance.measure('space-scene-initialisation', 'start-space-scene', 'space-scene-configured');

    }

    createEntities({ nAsteroids, nCrates, asteroidSize }) {

        this.skyBoxId = this.skyBoxEntity({ size: this.size });
        this.cameraId = this.cameraEntity({
            Size: 0.1, 
            Mass: 10,
            Orientation: identityQuat(),
            Position: [0, 0, 0],
            Camera: {
                near: 0.1,
                far: this.size * 2,
                fov: 60
            }
        })

        new Array(nCrates).fill(0).forEach(() => {
            this.crateEntity({
                Size: 10,
                Mass: 1000,
                Position: randomVector(-this.size, this.size),
                Velocity: randomVector(-100, 100)
            });
        });

        new Array(nAsteroids).fill(0).forEach(() => {
            const Size = asteroidSize.min + Math.random() * (asteroidSize.max - asteroidSize.min);
            this.asteroidEntity({
                Size,
                Mass: Size * 100000,
                Position: randomVector(-this.size, this.size),
                Velocity: randomVector(-10, 10)
            });
        });
    }

    createEntity(components) {
        const id = this.world.createEntity();
        for (const [key, value] of Object.entries(components)) {
            const k = `${key[0].toLowerCase()}${key.slice(1)}`;
            this.world.addComponent(id, k, value);
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
        this.world.addComponent(id, "renderable", this.crateRenderableId);
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
        this.world.addComponent(id, "renderable", this.asteroidRenderableId);
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
        this.world.addComponent(id, "camera", Camera);
        this.world.addComponent(id, "thrust", [0, 0, 0]);
        this.world.addComponent(id, "scriptable", [0, 0]);
        this.world.addComponent(id, "renderCamera", { viewProjMatrix: Array(16).fill(0), position: Array(3).fill(0) });
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
        this.world.addComponent(id, "renderable", this.skyBoxRenderableId);
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
        this.buffers.indexBy(this.world, "renderable", 0);
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
            device: this.device
        }
    }

    update() {
        performance.mark(`${this.constructor.name} start`);
        const ctx = this.ctx;
        this.scripts.update(ctx);
        this.commands.flush(ctx);
        for (const layer of this.layers.values()) {
            layer.update(ctx);
        }
        // this.layers.get("physics").update(ctx);
        // this.layers.get("transformations").update(ctx);
        // this.layers.get("render").update(ctx);
        // this.renderer.update(ctx);
        performance.mark(`${this.constructor.name} complete`);
        performance.measure(`${this.constructor.name} update`, `${this.constructor.name} start`, `${this.constructor.name} complete`);
    }

}
