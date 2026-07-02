import { System } from "./base.js";

export class RotationSystem extends System {
    constructor() {
        super({ Rotation: null, RotationSpeed: null });
    }

    update(world, deltaTime, activeEntities) {
        const query = world.query(['Rotation', 'RotationSpeed']);
        const matchingEntities = query.filter(activeEntities, world.signatures);

        const rotations = world.pools.Rotation.data;
        const speeds = world.pools.RotationSpeed.data;

        for (const entityId of matchingEntities) {
            rotations[entityId] += speeds[entityId] * deltaTime;
        }
    }
}
