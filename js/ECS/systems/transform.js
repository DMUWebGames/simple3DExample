import { System } from "./base.js";
import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";


// TODO: Perhaps I want this to be done in a compute shader?


export class TransformSystem extends System{ 

    constructor() {
        console.log("!!");
        
        super({ Transform: null });
    }
    
    update(world, deltaTime, activeEntities) { 
        const query = world.query(["Position", "Scale", "Orientation", "Transform"]);
        const matchingEntities = query.filter(activeEntities, world.signatures);
        
        for (const entityId in matchingEntities) {
            const transform = world.getComponent(entityId, "Transform");
            const position = world.getComponent(entityId, "Position");
            const orientation = world.getComponent(entityId, "Orientation");
            const scale = world.getComponent(entityId, "Scale");

            mat4.multiply(
                mat4.translation(position),
                mat4.multiply(
                    mat4.fromQuat(orientation),
                    mat4.scaling(scale)
                ),
                transform
            );

            world.updateComponent(entityId, "Transform", transform);

        }
    }
}