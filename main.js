import { performanceObserver } from "./js/performance.js";
import { SpaceScene } from "./js/scenes/space.js";

import { canvas } from "./js/setup.js";

const scene = new SpaceScene(canvas, {
    size: 10,
    nCrates: 0,
    nAsteroids: 1,
    asteroidSize: {min: 1, max: 1}
});

globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize(canvas));
globalThis.dispatchEvent(new Event("resize"));
console.log("scene created", scene);

scene.animate();


performanceObserver.observe({ entryTypes: ["measure"] });