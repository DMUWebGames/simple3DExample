import { quat, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

const LOCAL_FORWARD = [0, 0, -1];
let rollSpeed = 0;
let yawSpeed = 0;
let pitchSpeed = 0;

export function cameraScript({ yawAcc, pitchAcc, rollAcc, thrust, brake }, ctx) { 

    
    const { world, misc, entityId, deltaTime, input } = ctx;
 
    const cameraId = misc.get("activeCameraEntity");
    if (entityId !== cameraId) return;

    const orientation = world.getComponent(entityId, "Orientation");
    const mouse = input.get("mouse");
    const keys = input.get("keys");

    rollSpeed += (keys.d - keys.a) * rollAcc * deltaTime;
    yawSpeed += mouse.movementX * yawAcc * deltaTime;
    pitchSpeed += mouse.movementY * pitchAcc * deltaTime;

    // calculate the change in orientation based on mouse movement and key presses
    const deltaQuat = quat.fromEuler(
        pitchSpeed * deltaTime,
        yawSpeed * deltaTime,
        rollSpeed * deltaTime,
        "xyz"
    );
    quat.normalize(deltaQuat, deltaQuat);

    // update the orientation of the camera
    quat.mul(orientation, deltaQuat, orientation);
    quat.normalize(orientation, orientation);
    world.updateComponent(entityId, "Orientation", orientation);

    // calculate the forward acceleration, applying brake and thrust
    const forward = vec3.transformQuat(LOCAL_FORWARD, orientation);
    vec3.scale(forward, (keys.w * thrust - keys.s * brake) * deltaTime, forward);
    
    // apply forward acceleration to the camera's velocity
    const velocity = world.getComponent(entityId, "Velocity");
    vec3.add(velocity, forward, velocity);
    world.updateComponent(entityId, "Velocity", velocity);
}

