import { EntityFramework } from "../ECS/Framework.js";
import { CameraSystem } from "../ECS/systems/camera.js";
import { Renderer } from "../ECS/systems/renderer.js";
import { canvas, device } from "../setup.js";
import { cubeVertexBuffer } from "../cube.js";
import { MovementSystem } from "../ECS/systems/movement.js";
import { sphericalVertexBuffer } from "../sphere.js";
import { RotationSystem } from "../ECS/systems/rotation.js";
import { LightingSystem } from "../ECS/systems/lighting.js";
import { ControlSystem } from "../ECS/systems/controls.js";
import { randomOrientation } from "../tools.js";
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
const [cubeBuffer, cubeVertexCount] = cubeVertexBuffer(device);
const [asteroidBuffer, asteroidVertexCount] = sphericalVertexBuffer(device, 20, 1);


export class SpaceScene {
    constructor({size, nCubes, nAsteroids}) {
        this.size = size;
        this.framework = new EntityFramework({
            maxEntities: nCubes + nAsteroids + 1 + 1,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Orientation: { x: 0, y: 0, z: 0 },
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
                Keys: {
                    w: "thrust",
                    s: "break",
                    a: "rollLeft",
                    d: "rollRight",
                },
                Mouse: {
                    x: "yaw",
                    y: "pitch"
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
            vertexBuffer: asteroidBuffer,
            vertexCount: asteroidVertexCount,
            texture: asteroidTexture
        });

        new Array(nCubes).fill(0).forEach((_, i) => { 
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Renderable", cubeRenderableId);
            this.framework.addComponent(id, "Position", randomVector(-size, size));
            this.framework.addComponent(id, "Orientation", randomOrientation());
            this.framework.addComponent(id, "Angle", randomAngle());
            this.framework.addComponent(id, "Rotation", Math.PI * (Math.random() - 0.5));
            this.framework.addComponent(id, "Velocity", randomVector(-5, 5));
        })

        new Array(nAsteroids).fill(0).forEach((_, i) => { 
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Renderable", asteroidRenderableId);
            this.framework.addComponent(id, "Position", randomVector(-size, size));
            this.framework.addComponent(id, "Orientation", randomOrientation());
            this.framework.addComponent(id, "Angle", randomAngle());
            this.framework.addComponent(id, "Rotation", Math.PI * (Math.random() - 0.5));
            this.framework.addComponent(id, "Velocity", randomVector(-0.1, 0.1));
        })


        // Camera
        this.cameraEntity = this.framework.createEntity();
        this.framework.addComponent(this.cameraEntity, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.cameraEntity, "Orientation", randomOrientation());
        this.framework.addComponent(this.cameraEntity, "Rotation", Math.PI * (Math.random() - 0.5));
        this.framework.addComponent(this.cameraEntity, "Angle", randomAngle());
        this.framework.addComponent(this.cameraEntity, "Rotation", Math.PI * (Math.random() - 0.5));

        this.framework.addComponent(this.cameraEntity, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: this.size * 0.95,
            fov: 60
        });
        this.framework.addComponent(this.cameraEntity, "Keys", {
            w: "thrust",
            s: "break",
            a: "rollLeft",
            d: "rollRight",
        });
        this.framework.registerResource("activeCameraEntity", this.cameraEntity);

        // Lights
        this.lightId = this.framework.createEntity();
        this.framework.addComponent(this.lightId, "Direction", { x: -0.5, y: -1.0, z: 0.3, w: 0 });
        this.framework.addComponent(this.lightId, "Colour", { r: 0.95, g: 0.9, b: 0.3, a: 0 });
        this.framework.registerResource("activeLightEntity", this.lightId);

        // Systems
        this.framework.addSystem(new CameraSystem());
        this.framework.addSystem(new MovementSystem(this.size));
        this.framework.addSystem(new RotationSystem());
        this.framework.addSystem(new LightingSystem());
        this.framework.addSystem(new ControlSystem());
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
