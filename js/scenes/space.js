import { EntityFramework } from "../ECS/Framework.js";
import { CameraSystem } from "../ECS/systems/camera.js";
import { Renderer } from "../ECS/systems/renderer.js";
import { canvas, device } from "../setup.js";
import { cubeVertexBuffer } from "../cube.js";
import { MovementSystem } from "../ECS/systems/movement.js";
import { sphericalVertexBuffer } from "../sphere.js";
import { RotationSystem } from "../ECS/systems/rotation.js";
import { LightingSystem } from "../ECS/systems/lighting.js";
import { InputSystem } from "../ECS/systems/input.js";
import { randomOrientation, randomQuat, randomQuatBetween } from "../tools.js";
import { loadTexture } from "../texture.js";
import { loadMaterial } from "../material.js";
import { TransformSystem } from "../ECS/systems/transform.js";
import { ScriptingSystem } from "../ECS/systems/scripts.js";
import { greet } from "../../scripts/greet.js";
import { cameraScript } from "../../scripts/camera.js";

const randomVector = (min, max) => {
    return {
        x: min + (max - min) * Math.random(),
        y: min + (max - min) * Math.random(),
        z: min + (max - min) * Math.random(),
    }
}

const randomAngle = () => 2 * Math.PI * Math.random();


const [cubeBuffer, cubeVertexCount] = cubeVertexBuffer(device);
const [sphereBuffer, sphereVertexCount] = sphericalVertexBuffer(device, 20, 1);

const crateMaterial = await loadMaterial("materials/crate.json");
const asteroidMaterial = await loadMaterial("materials/asteroid.json");
const skyBoxMaterial = await loadMaterial("materials/skybox.json");

export class SpaceScene {
    constructor({ size, nCubes, nAsteroids }) {
        performance.mark('start-space-scene');
        this.size = size;
        this.framework = new EntityFramework({
            maxEntities: nCubes + nAsteroids + 1 + 1 + 1 + 1,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Orientation: randomQuat(),
                Rotation: randomQuatBetween(),
                Scale: [1, 1, 1],
                Transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
                Velocity: { x: 0, y: 0, z: 0 },
                Renderable: 0,
                Scriptable: {scriptId: 0, argumentId: 0},
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 100,
                    fov: 90
                },
                Direction: { x: 0.5, y: -1.0, z: 0.3, w: 0 },
                Colour: { r: 1, g: 1, b: 1, a: 0 },
                Input: {
                    yaw: 0,
                    pitch: 0,
                    roll: 0
                }
            }
        });

        // const cubeMaterialId = this.framework.registerResource("cubeMaterial", cubeMaterial);
        // const asteroidMaterialId = this.framework.registerResource("asteroidMaterial", asteroidMaterial);
        // const skyBoxMaterialId = this.framework.registerResource("skyBoxMaterial", skyBoxMaterial);


        const scripts = [greet, cameraScript]
        const scriptData = ["world", {
            yawSpeed: 0.05,
            pitchSpeed: 0.05,
            rollSpeed: 1
        }]


        // set up scripts
        // const scriptResourceId = this.framework.registerResource("scripts", scripts);
        // const scriptDataId = this.framework.registerResource("scriptData", scriptData);
        
        // Rendering data for Cubes
        const cubeRenderableId = this.framework.registerResource("cube", {
            vertexBuffer: cubeBuffer,
            vertexCount: cubeVertexCount,
            material: crateMaterial
        });

        // Rendering data for Asteroids
        const asteroidRenderableId = this.framework.registerResource("asteroid", {
            vertexBuffer: sphereBuffer,
            vertexCount: sphereVertexCount,
            material: asteroidMaterial
        });

        // Rendering data for the background
        const skyBoxRenderableId = this.framework.registerResource("background", {
            vertexBuffer: sphereBuffer,
            vertexCount: sphereVertexCount,
            material: skyBoxMaterial
        });

        this.framework.registerResource("keys", {
            a: false,
            d: false,
            w: false
        });
        this.framework.registerResource("mouse", {
            movementX: 0,
            movementY: 0
        });

        canvas.addEventListener("click", () => {
            if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        });
        canvas.addEventListener("mousemove", ev => {
            if (document.pointerLockElement === canvas) {
                const mouse = this.framework.getResource("mouse");
                mouse.movementX = ev.movementX;
                mouse.movementY = ev.movementY;
            }
        });

        window.addEventListener("keydown", ev => {
            const keys = this.framework.getResource("keys");
            console.log("!!");
            
            keys[ev.key] = true;
        });
        window.addEventListener("keyup", ev => {
            const keys = this.framework.getResource("keys");
            keys[ev.key] = false;
        });

        // console.log(Array.from(Object.values(randomVector(-size, size))))
        // exit

        new Array(nCubes).fill(0).forEach((_, i) => {
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Renderable", cubeRenderableId);

            this.framework.addComponent(id, "Transform", Array(16).fill(0));
            this.framework.addComponent(id, "Position", randomVector(-size, size));
            this.framework.addComponent(id, "Orientation", randomQuat());
            this.framework.addComponent(id, "Scale", [1, 1, 1]);

            this.framework.addComponent(id, "Rotation", randomQuat());
            this.framework.addComponent(id, "Velocity", randomVector(-5, 5));
        });

        new Array(nAsteroids).fill(0).forEach((_, i) => {
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Renderable", asteroidRenderableId);
            this.framework.addComponent(id, "Transform", Array(16).fill(0));
            this.framework.addComponent(id, "Position", randomVector(-size, size));
            this.framework.addComponent(id, "Orientation", randomQuat());
            this.framework.addComponent(id, "Scale", [10, 10, 10]);
            // this.framework.addComponent(id, "Angle", randomAngle());
            this.framework.addComponent(id, "Rotation", randomQuat());
            this.framework.addComponent(id, "Velocity", randomVector(-0.5, 0.5));
        });

        this.background = this.framework.createEntity();
        this.framework.addComponent(this.background, "Renderable", skyBoxRenderableId);
        this.framework.addComponent(this.background, "Transform", Array(16).fill(0));
        this.framework.addComponent(this.background, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.background, "Orientation", randomQuat());
        this.framework.addComponent(this.background, "Scale", [this.size, this.size, this.size]);

        // Camera
        // TODO: is camera position determined by some other factors?
        // e.g. the camera could be placed at different locations based on other game state?
        this.cameraId = this.framework.createEntity();
        this.framework.addComponent(this.cameraId, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.cameraId, "Orientation", randomQuat());
        // this.framework.addComponent(this.cameraId, "Rotation", randomQuat());
        this.framework.addComponent(this.cameraId, "Velocity", [0, 0, 0]);

        this.framework.addComponent(this.cameraId, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: this.size,
            fov: 60
        });
        this.framework.addComponent(this.cameraId, "Scriptable", [1, 1]);
        
        // Lights
        this.lightId = this.framework.createEntity();
        this.framework.addComponent(this.lightId, "Direction", { x: -0.5, y: -1.0, z: 0.3, w: 0 });
        this.framework.addComponent(this.lightId, "Colour", { r: 0.95, g: 0.9, b: 0.3, a: 0 });

        // Player
        this.playerId = this.framework.createEntity();
        this.framework.addComponent(this.playerId, "Input", { yaw: 0, pitch: 0, roll: 0 });
        
        // Register some things for systems to access 
        this.framework.registerResource("activeCameraEntity", this.cameraId);
        this.framework.registerResource("activeLightEntity", this.lightId);
        this.framework.registerResource("activePlayerEntity", this.playerId);
        // this.framework.registerResource("scripts", scriptResourceId);
        // this.framework.registerResource("scriptData", scriptDataId);

        // Systems
        // this.framework.addSystem(new InputSystem(canvas));
        this.framework.addSystem(new ScriptingSystem(scripts, scriptData));
        this.framework.addSystem(new CameraSystem());
        this.framework.addSystem(new MovementSystem(this.size));
        this.framework.addSystem(new RotationSystem());
        this.framework.addSystem(new LightingSystem());
        this.framework.addSystem(new TransformSystem());
        this.framework.addSystem(new Renderer());

        performance.mark('space-scene-configured');

    }

    resize() {
        this.framework.systems.forEach(system => {
            if ("resize" in system) {                
                system.resize(this.framework, canvas)
            }
        });
    }

    animate() { 
        requestAnimationFrame(this.frame.bind(this));
    }

    frame(ts) {
        const deltaTime = ts - (this.prevTime || ts);
        this.prevTime = ts;
        this.framework.update(deltaTime / 1000);
        requestAnimationFrame(this.frame.bind(this));
    }
}
