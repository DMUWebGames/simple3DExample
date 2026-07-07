import { System } from "./base.js";

export class RotationSystem extends System {
    constructor() {
        super({ Angle: null, Rotation: null });
    }

    update(world, deltaTime, activeEntities) {
        const query = world.query(['Angle', "Rotation"]);
        const matchingEntities = query.filter(activeEntities, world.signatures);

        const angles = world.pools.Angle.data;
        const rotations = world.pools.Rotation.data;

        for (const entityId of matchingEntities) {
            angles[entityId] += rotations[entityId] * deltaTime;
        }
    }

    resize() { }
}
