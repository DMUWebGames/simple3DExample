import { device } from "./setup.js";

const shaders = new Map();

export async function createShader(path) {
    const response = await fetch(`./shaders/${path}`);
    const code = await response.text();
    if (!shaders.has(path)) {
        const module = device.createShaderModule({ code, label: path });
        shaders.set(path, module);
    }
    return shaders.get(path);
}