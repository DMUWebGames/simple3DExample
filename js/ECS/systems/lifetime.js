import { System } from "./base.js";

export class LifetimeSystem extends System {
    constructor() {
        super({ Lifetime: null });
    }

    update(world, deltaTime, activeEntities) {
        const query = world.query(['Lifetime']);
        const matchingEntities = query.filter(activeEntities, world.signatures);

        const lifetimes = world.pools.Lifetime.data;

        for (const entityId of matchingEntities) {
            lifetimes[entityId] -= deltaTime;
            if (lifetimes[entityId] <= 0) {
                world.destroyEntity(entityId);
            }
        }
    }
}
