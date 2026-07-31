import { quat, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

export function cameraScript(entityId, { torque, thrust, brake }, ctx) { 
    
    const { input, commands, canvas } = ctx;
    
    let data = [0, 0, 0];
    if (document.pointerLockElement === canvas) {
        const mouse = input.get("mouse");
        const keys = input.get("keys");
        const [x, y, z] = torque;
        data = [
            mouse.movementY * x,
            mouse.movementX * y,
            (keys.d - keys.a) * z
        ];
    }


    commands.push({ type: "write", entityId, component: "Torque", data: new Float32Array([...data, 0])});
    // commands.push({ type: "write", entityId, component: "Acceleration", data: new Float32Array(data)});

}

