import { EntityFramework } from "./js/ECS/Framework.js";
import { CameraSystem } from "./js/ECS/systems/camera.js";
import { RenderSystem } from "./js/ECS/systems/RenderSystem.js";
import { canvas } from "./js/setup.js";

class TestScene {
    constructor() {
        this.framework = new EntityFramework({
            maxEntities: 32,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 1000,
                    fov: 60
                }
            }
        });

        this.objectEntity = this.framework.createEntity();
        this.framework.addComponent(this.objectEntity, "Position", { x: 0, y: 0, z: -3 });

        this.cameraEntity = this.framework.createEntity();
        this.framework.addComponent(this.cameraEntity, "Position", { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.cameraEntity, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: 1000,
            fov: 60
        });

        this.cameraSystem = new CameraSystem();
        this.framework.addSystem(this.cameraSystem);

        this.renderSystem = new RenderSystem(this);
        this.renderSystem.setCameraEntity(this.cameraEntity);
        this.framework.addSystem(this.renderSystem);

        this.asteroids = [this.objectEntity];
        this.scene = this;
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
