import { EntityFramework, MovementSystem, RotationSystem } from "../ECS/Framework.js";
import { RenderSystem } from "../RenderSystem.js";
import { device } from "../setup.js";

export class SpaceScene { 
    constructor() { 
        // Initialise framework with components
        this.framework = new EntityFramework({
            maxEntities: 1001,
            components: {
                Position: { x: 0, y: 0, z: 0 },
                Velocity: { x: 0, y: 0, z: 0 },
                Rotation: 0,
                RotationSpeed: 0,
                Camera: {
                    aspect: 16 / 9,
                    near: 0.1,
                    far: 1000,
                    fov: 60
                }
            }
        });

        // create asteroids
        this.asteroids = Array.from({ length: 1000 }, (_, i) => {
            const id = this.framework.createEntity();
            this.framework.addComponent(id, 'Position', { x: 0, y: 0, z: 0 });
            this.framework.addComponent(id, 'Velocity', { x: 0.1, y: 0, z: 0 });
            return id;
        });

        this.camera = this.framework.createEntity();
        this.framework.addComponent(this.camera, 'Position', { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.camera, 'Velocity', { x: 0, y: 0, z: 0 });
        this.framework.addComponent(this.camera, "Camera", {
            aspect: 16 / 9,
            near: 0.1,
            far: 1000,
            fov: 60
        });
        // new Camera(canvas, this.radius);
        

        // setup movement and rotation
        this.framework.addSystem(new MovementSystem);
        // this.framework.addSystem(new RotationSystem);

        // setup rendering
        this.renderSystem = new RenderSystem(this)
        this.framework.addSystem(this.renderSystem);
    }

    resize(ev) {
        console.log("resize space");
        this.renderSystem.resize(ev)
    }

    animate(ts) { 
        const deltaTime = ts - this.prev || 0;
        this.prev = ts;
        this.framework.update(deltaTime);
        // console.log(this.framework.getStats());
        
        requestAnimationFrame(this.animate.bind(this));
    }

}

