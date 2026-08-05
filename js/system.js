import { createShader } from "./shader.js";

export async function loadSystem(name) {
    const response = await fetch(`./data/systems/${name}.json`);
    const system = await response.json();
    system.module = await createShader(system.shader);
    system.label = system.shader.split(".").slice(0, -1).join(".");
    return system;
}