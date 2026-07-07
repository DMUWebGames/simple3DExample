import { System } from "./base.js";

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
            [0, 1, 2].forEach(i => position[i] += velocity[i] * deltaTime);
            world.updateComponent(entityId, "Position", position);            
        }
    }

}
