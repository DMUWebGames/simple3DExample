import { loadTexture } from "./texture.js";
import { createShader } from "./shader.js";

export async function loadMaterial(url) { 
    const res = await fetch(url);
    const data = await res.json();
    data.module = await createShader(data.module);
    data.textures = await Promise.all(data.textures.map(path => {
        return loadTexture(path);
    }));
    return data;
}