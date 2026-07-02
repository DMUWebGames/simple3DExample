import { System } from "./base.js";

export class MovementSystem extends System {
    constructor() {
        super({ Position: null, Velocity: null });
    }

    update(world, deltaTime, activeEntities) {
        const query = world.query(['Position', 'Velocity']);
        const matchingEntities = query.filter(activeEntities, world.signatures);

        const positions = world.pools.Position.data;
        const velocities = world.pools.Velocity.data;

        for (const entityId of matchingEntities) {
            const posOffset = entityId * 3;
            const velOffset = entityId * 3;

            positions[posOffset] += velocities[velOffset] * deltaTime;
            positions[posOffset + 1] += velocities[velOffset + 1] * deltaTime;
            positions[posOffset + 2] += velocities[velOffset + 2] * deltaTime;
        }
    }
}
