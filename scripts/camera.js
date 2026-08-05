import { quat, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

export function cameraScript(entityId, { torque, thrust, brake }, ctx) { 
    const { input, commands, canvas } = ctx;
    let torqueData = [0, 0, 0];
    let thrustData = [0, 0, 0];
    if (document.pointerLockElement === canvas) {
        const mouse = input.get("mouse");
        const keys = input.get("keys");
        const [x, y, z] = torque;
        torqueData = [
            mouse.movementY * x,
            mouse.movementX * y,
            (keys.d - keys.a) * z
        ];
        thrustData = [0, 0, (keys.w * thrust - keys.s * brake)];
    }
    commands.push({ type: "write", entityId, component: "torque", data: new Float32Array([...torqueData, 0])});
    commands.push({ type: "write", entityId, component: "thrust", data: new Float32Array(thrustData)});
}

