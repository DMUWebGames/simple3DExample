import { EntityFramework } from "./js/ECS/Framework.js";
import { CameraSystem } from "./js/ECS/systems/camera.js";
import { Renderer } from "./js/ECS/systems/renderer.js";
import { canvas, device } from "./js/setup.js";
import { cubeVertexBuffer } from "./js/cube.js";
import { MovementSystem } from "./js/ECS/systems/movement.js";

class TestScene {
    constructor(nCubes) {
        this.framework = new EntityFramework({
            maxEntities: nCubes + 1,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Velocity: { x: 0, y: 0, z: 0 },
                Renderable: { mesh: "" },
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 1000,
                    fov: 90
                }
            }
        });

        const meshNames = ["cube"];
        this.framework.registerResource("meshNames", meshNames);

        const [cubeBuffer, cubeVertexCount] = cubeVertexBuffer(device);
        this.framework.registerResource("cube", {
            kind: "mesh",
            vertexBuffer: cubeBuffer,
            vertexCount: cubeVertexCount
        });


        new Array(nCubes).fill(0).forEach((_, i) => { 
            const id = this.framework.createEntity();
            this.framework.addComponent(id, "Position", { x: Math.random() - 0.5, y: Math.random() - 0.5, z: -30 });
            this.framework.addComponent(id, "Velocity", { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: 0.001 });
            this.framework.addComponent(id, "Renderable", meshNames.indexOf("cube"));
        })

        this.cameraEntity = this.framework.createEntity();
        this.framework.addComponent(this.cameraEntity, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.cameraEntity, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: 1000,
            fov: 90
        });

        this.framework.registerResource("activeCameraEntity", this.cameraEntity);

        this.cameraSystem = new CameraSystem();
        this.framework.addSystem(this.cameraSystem);

        this.renderSystem = new Renderer();
        this.framework.addSystem(this.renderSystem);

        this.movementSystem = new MovementSystem();
        this.framework.addSystem(this.movementSystem);

    }

    resize() {
        this.renderSystem.resize();
        this.cameraSystem.updateAspect(this.framework, this.cameraEntity, canvas.width, canvas.height);
    }

    animate(ts) {
        const deltaTime = ts - (this.prevTime || ts);
        this.prevTime = ts;
        this.framework.update(deltaTime);
        requestAnimationFrame(this.animate.bind(this));
    }
}

const scene = new TestScene(500);
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
