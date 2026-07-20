import { canvas } from "../js/setup.js";
import { quat, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

const LOCAL_FORWARD = [0, 0, -1];

export function cameraScript({yawSpeed, pitchSpeed, rollSpeed, thrust}, { world, entityId, deltaTime }) { 
    const orientation = world.getComponent(entityId, "Orientation");
    const mouse = world.getResource("mouse");
    const keys = world.getResource("keys");

    const deltaQuat = quat.fromEuler(
        mouse.movementY * pitchSpeed * deltaTime,
        mouse.movementX * yawSpeed * deltaTime,
        (keys.d - keys.a) * rollSpeed * deltaTime,
        "xyz"
    );
    quat.normalize(deltaQuat, deltaQuat);
    quat.mul(orientation, deltaQuat, orientation);
    quat.normalize(orientation, orientation);
    world.updateComponent(entityId, "Orientation", orientation);
    
    const velocity = world.getComponent(entityId, "Velocity");
    const forward = vec3.transformQuat(LOCAL_FORWARD, orientation);
    
    vec3.scale(forward, keys.w * thrust * deltaTime, forward);
    
    vec3.add(velocity, forward, velocity);

    world.updateComponent(entityId, "Velocity", velocity);

}

