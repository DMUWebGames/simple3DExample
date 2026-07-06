import { EntityFramework } from "../ECS/Framework.js";
import { CameraSystem } from "../ECS/systems/camera.js";
import { Renderer } from "../ECS/systems/renderer.js";
import { canvas, device } from "../setup.js";
import { cubeVertexBuffer } from "../cube.js";
import { MovementSystem } from "../ECS/systems/movement.js";
import { sphericalVertexBuffer } from "../sphere.js";
import { RotationSystem } from "../ECS/systems/rotation.js";
import { LightingSystem } from "../ECS/systems/lighting.js";

const randomVector = (min, max) => {
    return {
        x: min + (max - min) * (Math.random() * 2 - 1),
        y: min + (max - min) * (Math.random() * 2 - 1),
        z: min + (max - min) * (Math.random() * 2 - 1),
    }
}

export class TestScene {
    constructor(nCubes, nAsteroids) {
        this.framework = new EntityFramework({
            maxEntities: nCubes + nAsteroids + 1 + 1,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Velocity: { x: 0, y: 0, z: 0 },
                Renderable: { mesh: "" },
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 100,
                    fov: 90
                },
                Direction: { x: 0.5, y: -1.0, z: 0.3, w: 0 },
                Colour: { r: 1, g: 1, b: 1, a: 0 }
            }
        });

        // Cubes
        const [cubeBuffer, cubeVertexCount] = cubeVertexBuffer(device);
        const cubeMeshId = this.framework.registerResource("cubeMesh", {
            vertexBuffer: cubeBuffer,
            vertexCount: cubeVertexCount
        });

        new Array(nCubes).fill(0).forEach((_, i) => { 
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Position", randomVector(0, 20));
            this.framework.addComponent(id, "Velocity", randomVector(0, 0.001));
            this.framework.addComponent(id, "Renderable", cubeMeshId);
        })

        // Asteroids
        const [asteroidBuffer, asteroidVertexCount] = sphericalVertexBuffer(device, 20, 1, true);
        const asteroidMeshId = this.framework.registerResource("asteroidMesh", {
            vertexBuffer: asteroidBuffer,
            vertexCount: asteroidVertexCount
        });

        new Array(nAsteroids).fill(0).forEach((_, i) => { 
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Position", randomVector(0, 20));
            this.framework.addComponent(id, "Velocity", randomVector(0, 0.001));
            this.framework.addComponent(id, "Renderable", asteroidMeshId);
        })


        // Camera
        this.cameraEntity = this.framework.createEntity();
        this.framework.addComponent(this.cameraEntity, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.cameraEntity, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: 10000,
            fov: 60
        });
        this.framework.registerResource("activeCameraEntity", this.cameraEntity);

        // Lights
        this.lightId = this.framework.createEntity();
        this.framework.addComponent(this.lightId, "Direction", { x: -0.5, y: -1.0, z: 0.3, w: 0 });
        this.framework.addComponent(this.lightId, "Colour", { r: 0.95, g: 0.9, b: 0.3, a: 0 });
        this.framework.registerResource("activeLightEntity", this.lightId);

        // Systems
        this.framework.addSystem(new CameraSystem());
        this.framework.addSystem(new MovementSystem());
        this.framework.addSystem(new LightingSystem());
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
        this.framework.update(deltaTime);
        requestAnimationFrame(this.animate.bind(this));
    }
}
