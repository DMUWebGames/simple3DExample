import { cubeVertices } from "../../js/cube.js";
import { sphericalVertices } from "../../js/sphere.js";

function toJSON(data) {
    return JSON.stringify({
        vertices: Array.from(data),
        stride: 8
    }, null, 2);
}

const cube = toJSON(cubeVertices);
await Deno.writeTextFile("./meshes/cube.json", cube);

for (const segments of [5, 10, 15, 20, 50]) {
    const path = `./meshes/sphere_${segments.toString().padStart(2, 0)}.json`;
    const sphere = toJSON(sphericalVertices(segments, 1));
    await Deno.writeTextFile(path, sphere);
}