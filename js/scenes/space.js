performance.mark('space-scene-module');

import { EntityFramework } from "../Engine/ECS/Framework.js";
import { CameraSystem } from "../Engine/systems/camera.js";
import { Renderer } from "../Engine/systems/renderer.js";
import { canvas, device } from "../setup.js";
import { cubeVertexBuffer } from "../cube.js";
import { MovementSystem } from "../Engine/systems/movement.js";
import { sphericalVertexBuffer } from "../sphere.js";
import { RotationSystem } from "../Engine/systems/rotation.js";
import { LightingSystem } from "../Engine/systems/lighting.js";
import { identityQuat, randomQuat, randomQuatBetween, randomVector } from "../tools.js";
import { loadMaterial } from "../material.js";
import { TransformSystem } from "../Engine/systems/transform.js";
import { ScriptingSystem } from "../Engine/systems/scripts.js";
import { cameraScript } from "../../scripts/camera.js";
import { GPUBufferManager } from "../Engine/GPUBuffers.js";
import { ResourceRegistry } from "../Engine/ResourceRegistry.js";
import { CommandQueue } from "../Engine/CommandQueue.js";
import { Scene } from "../Engine/scene.js";

const [cubeBuffer, cubeVertexCount] = cubeVertexBuffer(device);
const [sphereBuffer, sphereVertexCount] = sphericalVertexBuffer(device, 20, 1);

const crateMaterial = await loadMaterial("materials/crate.json");
const asteroidMaterial = await loadMaterial("materials/asteroid.json");
const skyBoxMaterial = await loadMaterial("materials/skybox.json");

performance.mark('space-scene-assets-loaded');
performance.measure('space-scene-assets', 'space-scene-module', 'space-scene-assets-loaded');


export class SpaceScene extends Scene {
    constructor({ size, nCubes, nAsteroids }) {
        super({
            maxEntities: nCubes + nAsteroids + 1 + 1 + 1, // camera, skybox, light
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Velocity: { x: 0, y: 0, z: 0 },
                Acceleration: { x: 0, y: 0, z: 0 },
                Orientation: randomQuat(),
                Rotation: randomQuat(),
                Scale: [1, 1, 1],
                Transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
                Renderable: 0,
                Scriptable: {scriptId: 0, argumentId: 0},
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 100,
                    fov: 90
                },
                RenderCamera: Array(64 + 3).fill(0),
                Direction: { x: 0.5, y: -1.0, z: 0.3, w: 0 },
                Colour: { r: 1, g: 1, b: 1, a: 0 },
            }
        });
        performance.mark('start-space-scene');
        this.size = size;

        // Rendering data for Cubes
        const cubeRenderableId = this.renderables.set("cube", {
            vertexBuffer: cubeBuffer,
            vertexCount: cubeVertexCount,
            material: crateMaterial
        });

        // Rendering data for Asteroids
        const asteroidRenderableId = this.renderables.set("asteroid", {
            vertexBuffer: sphereBuffer,
            vertexCount: sphereVertexCount,
            material: asteroidMaterial
        });

        // Rendering data for the background
        const skyBoxRenderableId = this.renderables.set("background", {
            vertexBuffer: sphereBuffer,
            vertexCount: sphereVertexCount,
            material: skyBoxMaterial
        });

        this.input.set("keys", {
            a: false,
            d: false,
            w: false,
            s: false
        });
        this.input.set("mouse", {
            movementX: 0,
            movementY: 0
        });

        canvas.addEventListener("click", () => {
            if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        });

        const mouse = this.input.get("mouse");
        const keys = this.input.get("keys");

        function updateMouse(ev) { 
            mouse.movementX = ev.movementX;
            mouse.movementY = ev.movementY;
        }

        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === canvas) {
                canvas.addEventListener("mousemove", updateMouse);
            } else {
                canvas.removeEventListener("mousemove", updateMouse);
            }
        });

        globalThis.addEventListener("keydown", ev => {
            // const keys = this.world.getResource("keys");
            keys[ev.key] = true;
        });
        globalThis.addEventListener("keyup", ev => {
            // const keys = this.world.getResource("keys");
            keys[ev.key] = false;
        });

        new Array(nCubes).fill(0).forEach(() => {
            const id = this.world.createEntity();
            this.world.addComponent(id, "Renderable", cubeRenderableId);
            this.world.addComponent(id, "Position", randomVector(-size, size));
            this.world.addComponent(id, "Velocity", randomVector(-1, 1));
            this.world.addComponent(id, "Orientation", randomQuat());
            this.world.addComponent(id, "Rotation", randomQuat());
            this.world.addComponent(id, "Scale", Array(3).fill(1));
            this.world.addComponent(id, "Transform", Array(16).fill(0));
        });

        new Array(nAsteroids).fill(0).forEach(() => {
            const id = this.world.createEntity();
            const asteroidSize = 2 + Math.random() * 8;
            this.world.addComponent(id, "Renderable", asteroidRenderableId);
            this.world.addComponent(id, "Position", randomVector(-size, size));
            this.world.addComponent(id, "Velocity", randomVector(-5, 5));
            this.world.addComponent(id, "Orientation", randomQuat());
            this.world.addComponent(id, "Rotation", randomQuatBetween(-0.1, 0.1));
            this.world.addComponent(id, "Scale", Array(3).fill(asteroidSize));
            this.world.addComponent(id, "Transform", Array(16).fill(0));
        });

        this.background = this.world.createEntity();
        this.world.addComponent(this.background, "Renderable", skyBoxRenderableId);
        this.world.addComponent(this.background, "Position", { x: 0, y: 0, z: 0 });
        this.world.addComponent(this.background, "Velocity", { x: 0, y: 0, z: 0 });
        this.world.addComponent(this.background, "Orientation", identityQuat());
        this.world.addComponent(this.background, "Rotation", identityQuat());
        this.world.addComponent(this.background, "Scale", [this.size, this.size, this.size]);
        this.world.addComponent(this.background, "Transform", Array(16).fill(0));

        // Lights
        this.lightId = this.world.createEntity();
        this.world.addComponent(this.lightId, "Direction", { x: -0.5, y: -1.0, z: 0.3, w: 0 });
        this.world.addComponent(this.lightId, "Colour", { r: 0.95, g: 0.9, b: 0.8, a: 0 });


        // Camera
        // TODO: is camera position determined by some other factors?
        // e.g. the camera could be placed at different locations based on other game state?
        this.cameraId = this.world.createEntity();
        this.world.addComponent(this.cameraId, "Position", { x: 0, y: 0, z: 0 });
        this.world.addComponent(this.cameraId, "Velocity", [0, 0, 0]);
        this.world.addComponent(this.cameraId, "Acceleration", [0, 0, 0]);
        this.world.addComponent(this.cameraId, "Orientation", identityQuat());
        this.world.addComponent(this.cameraId, "Rotation", identityQuat());

        this.world.addComponent(this.cameraId, "Camera", {
            aspect: canvas.height / canvas.width,
            near: 0.1,
            far: this.size*2,
            fov: 60
        });
        this.world.addComponent(this.cameraId, "RenderCamera", Array(64 + 3).fill(0));
        this.world.addComponent(this.cameraId, "Scriptable", [0, 0]);
        

        // Register some things for systems to access 
        this.misc.set("activeCameraEntity", this.cameraId);
        this.misc.set("activeLightEntity", this.lightId);

        // set up scripts
        const scripts = [cameraScript]
        const scriptData = [{
            yawAcc: -0.05,
            pitchAcc: -0.05,
            rollAcc: -2,
            thrust: this.size / 100,
            brake: this.size / 100
        }]

        this.createBuffers();

        // Layers
        this.addLayer("scripts", [
            new ScriptingSystem(scripts, scriptData)
        ]);
        this.addLayer("simulation", [
            new MovementSystem(this.size),
            new RotationSystem(),
            new TransformSystem()
        ]);
        this.addLayer("render", [
            new CameraSystem(),
            new LightingSystem(),
            new Renderer()
        ]);

        performance.mark('space-scene-configured');
        performance.measure('space-scene-initialisation', 'start-space-scene', 'space-scene-configured');

    }

    createBuffers() { 

        // Storage buffers for all components
        this.buffers.createFromWorld(this.world);
        this.buffers.indexBy(this.world, "Renderable", 0);

        this.buffers.createUniform({
            label: "activeCamera",
            data: new Uint32Array([this.cameraId])
        });

        this.buffers.createUniform({
            label: "size",
            data: new Float32Array([this.size])
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
            canvas
        }
    }

    update(deltaTime) {
        performance.mark(`${this.constructor.name} start`);

        const ctx = this.ctx;

        this.layers.get("scripts").update(ctx);
        
        this.commands.flush(ctx);

        this.layers.get("simulation").update(ctx);
        this.layers.get("render").update(ctx);
        
        performance.mark(`${this.constructor.name} complete`);
        performance.measure(`${this.constructor.name} update`, `${this.constructor.name} start`, `${this.constructor.name} complete`);
    }



}
