import { loadMaterial } from "./material.js";
import { loadMesh } from "./mesh.js";

export async function loadModel(name) { 
    const response = await fetch(`./data/models/${name}.json`);
    const model = await response.json();
    model.material = await loadMaterial(model.material);
    model.mesh = await loadMesh(model.mesh);
    return model;
    
} 