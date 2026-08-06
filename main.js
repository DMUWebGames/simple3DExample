import { Scene } from "./js/Engine/scene.js";
import { performanceObserver } from "./js/performance.js";

import { device, canvas } from "./js/setup.js";

async function loadScene(name) {
    const url = `./data/scenes/${name}.json`;
    const response = await fetch(url);
    const config = await response.json();
    console.log(config);
    return Scene.create(device, canvas, config);
}

const scene = await loadScene("space");

globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize(canvas));
globalThis.dispatchEvent(new Event("resize"));
console.log("scene created", scene);

scene.animate();

performanceObserver.observe({ entryTypes: ["measure"] });