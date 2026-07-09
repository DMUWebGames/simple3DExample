import { System } from "./base.js";
import { quat } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

export class RotationSystem extends System {
    constructor() {
        super({ Orientation: null, Rotation: null });
    }

    update(world, deltaTime, activeEntities) {
        const query = world.query(['Orientation', "Rotation"]);
        const matchingEntities = query.filter(activeEntities, world.signatures);

        for (const entityId of matchingEntities) {
            const orientation = world.getComponent(entityId, "Orientation");
            const rotation = world.getComponent(entityId, "Rotation");
            const frameDelta = quat.slerp(quat.identity(), rotation, deltaTime);
            const newOrientation = quat.create();
            quat.mul(orientation, frameDelta, newOrientation);
            quat.normalize(newOrientation, newOrientation);
            world.updateComponent(entityId, "Orientation", newOrientation);
        }
    }

    resize() { }
}
