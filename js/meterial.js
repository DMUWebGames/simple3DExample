import { loadTexture } from "./texture.js";
import { device } from "./setup.js";

const shaders = new Map();

async function createShader(path) {
    const response = await fetch(`./../shaders/${path}`);
    const code = await response.text();
    if (!shaders.has(path)) {
        const module = device.createShaderModule({ code, label: path });
        shaders.set(path, module);
    }
    return shaders.get(path);
}

export async function loadMaterial(url) { 
    const res = await fetch(url);
    const data = await res.json();
    data.module = await createShader(data.module);
    data.textures = await Promise.all(data.textures.map(path => {
        return loadTexture(path);
    }));
    return data;
}