import { EntityFramework } from "./js/ECS/Framework.js";
import { CameraSystem } from "./js/ECS/systems/camera.js";
import { Renderer } from "./js/ECS/systems/renderer.js";
import { canvas, device } from "./js/setup.js";
import { cubeVertexBuffer } from "./js/cube.js";

class TestScene {
    constructor() {
        this.framework = new EntityFramework({
            maxEntities: 32,
            components: {
                Position: { x: 0, y: 0, z: 0 },
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

        this.myEntity = this.framework.createEntity();
        this.framework.addComponent(this.myEntity, "Position", { x: 0, y: 0, z: -3 });
        this.framework.addComponent(this.myEntity, "Renderable", meshNames.indexOf("cube"));

        this.myEntity2 = this.framework.createEntity();
        this.framework.addComponent(this.myEntity2, "Position", { x: 0, y: 2, z: -5 });
        this.framework.addComponent(this.myEntity2, "Renderable", meshNames.indexOf("cube"));


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

const scene = new TestScene();
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
