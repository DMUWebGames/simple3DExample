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
import { randomOrientation, randomQuat } from "../tools.js";
import { loadTexture } from "../texture.js";

const randomVector = (min, max) => {
    return {
        x: min + (max - min) * Math.random(),
        y: min + (max - min) * Math.random(),
        z: min + (max - min) * Math.random(),
    }
}

const randomAngle = () => 2 * Math.PI * Math.random();

const asteroidTexture = await loadTexture('textures/asteroid.jpg');
const cubeTexture = await loadTexture('textures/cube.jpg');
const celestialGridTexture = await loadTexture('textures/celestial_grid_bright.jpg');
const [cubeBuffer, cubeVertexCount] = cubeVertexBuffer(device);
const [sphereBuffer, sphereVertexCount] = sphericalVertexBuffer(device, 20, 1);


export class SpaceScene {
    constructor({size, nCubes, nAsteroids}) {
        this.size = size;
        this.framework = new EntityFramework({
            maxEntities: nCubes + nAsteroids + 1 + 1 + 1,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Orientation: { x: 0, y: 0, z: 0 },
                Scale: 0,
                Angle: 0,
                Rotation: 0,
                Velocity: { x: 0, y: 0, z: 0 },
                Renderable: { mesh: "" },
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 100,
                    fov: 90
                },
                Direction: { x: 0.5, y: -1.0, z: 0.3, w: 0 },
                Colour: { r: 1, g: 1, b: 1, a: 0 },
                Control: {
                    yaw: 0,
                    pitch: 0,
                    roll: 0
                }
            }
        });

        // Rendering data for Cubes
        const cubeRenderableId = this.framework.registerResource("cube", {
            vertexBuffer: cubeBuffer,
            vertexCount: cubeVertexCount,
            texture: cubeTexture
        });

        // Rendering data for Asteroids
        const asteroidRenderableId = this.framework.registerResource("asteroid", {
            vertexBuffer: sphereBuffer,
            vertexCount: sphereVertexCount,
            texture: asteroidTexture
        });

        // Rendering data for the background
        const backgroundRenderableId = this.framework.registerResource("background", {
            vertexBuffer: sphereBuffer,
            vertexCount: sphereVertexCount,
            texture: celestialGridTexture
        });

        new Array(nCubes).fill(0).forEach((_, i) => {
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Renderable", cubeRenderableId);
            this.framework.addComponent(id, "Position", randomVector(-size, size));
            this.framework.addComponent(id, "Orientation", randomQuat());
            this.framework.addComponent(id, "Scale", 1);
            this.framework.addComponent(id, "Angle", randomAngle());
            this.framework.addComponent(id, "Rotation", Math.PI * (Math.random() - 0.5));
            this.framework.addComponent(id, "Velocity", randomVector(-5, 5));
        });

        new Array(nAsteroids).fill(0).forEach((_, i) => {
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Renderable", asteroidRenderableId);
            this.framework.addComponent(id, "Position", randomVector(-size, size));
            this.framework.addComponent(id, "Orientation", randomQuat());
            this.framework.addComponent(id, "Scale", 1);
            this.framework.addComponent(id, "Angle", randomAngle());
            this.framework.addComponent(id, "Rotation", Math.PI * (Math.random() - 0.5));
            this.framework.addComponent(id, "Velocity", randomVector(-0.1, 0.1));
        });

        this.background = this.framework.createEntity();
        this.framework.addComponent(this.background, "Renderable", backgroundRenderableId);
        this.framework.addComponent(this.background, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.background, "Scale", this.size);

        // Camera
        this.cameraId = this.framework.createEntity();
        this.framework.addComponent(this.cameraId, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.cameraId, "Orientation", randomQuat());

        this.framework.addComponent(this.cameraId, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: this.size,
            fov: 60
        });

        // Controls
        // this.framework.addComponent(this.cameraId, "Forward", { x: 0, y: 0, z: 1 });
        // this.framework.addComponent(this.cameraId, "Control", {
        //     yaw: 0,
        //     pitch: 0,
        //     roll: 0
        // });
        
        // Lights
        this.lightId = this.framework.createEntity();
        this.framework.addComponent(this.lightId, "Direction", { x: -0.5, y: -1.0, z: 0.3, w: 0 });
        this.framework.addComponent(this.lightId, "Colour", { r: 0.95, g: 0.9, b: 0.3, a: 0 });
        
        // Register some things for systems to access 
        this.framework.registerResource("activeCameraEntity", this.cameraId);
        this.framework.registerResource("activeLightEntity", this.lightId);
        this.framework.registerResource("activePlayerEntity", this.cameraId);

        // Systems
        this.framework.addSystem(new CameraSystem());
        this.framework.addSystem(new MovementSystem(this.size));
        this.framework.addSystem(new RotationSystem());
        this.framework.addSystem(new LightingSystem());
        this.framework.addSystem(new InputSystem(canvas));
        this.framework.addSystem(new Renderer());

    }

    resize() {
        this.framework.systems.forEach(system => {
            if ("resize" in system) {                
                system.resize(this.framework, canvas)
            }
        });
    }

    animate(ts) {
        const deltaTime = ts - (this.prevTime || ts);
        this.prevTime = ts;
        this.framework.update(deltaTime / 1000);
        requestAnimationFrame(this.animate.bind(this));
    }
}
