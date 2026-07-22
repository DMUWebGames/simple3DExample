import { System } from "./base.js";
import { vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

export class MovementSystem extends System {
    constructor(size) {
        super({ Position: null, Velocity: null });
        this.size = size;
    }

    update(world, deltaTime, activeEntities) {
        const query = world.query(['Position', 'Velocity']);
        const matchingEntities = query.filter(activeEntities, world.signatures);
        
        for (const entityId of matchingEntities) {
            const position = world.getComponent(entityId, "Position");
            const velocity = world.getComponent(entityId, "Velocity");
            vec3.add(
                position,
                vec3.mulScalar(velocity, deltaTime),
                position
            )
            if(vec3.length(position) > this.size) {
                vec3.negate(position, position);
            }
            world.updateComponent(entityId, "Position", position);
        }
    }
}
