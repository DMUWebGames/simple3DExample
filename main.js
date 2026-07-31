import { performanceObserver } from "./js/performance.js";
import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 10,
    nCrates: 2,
    nAsteroids: 1
});

globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize());
globalThis.dispatchEvent(new Event("resize"))

scene.animate();

performanceObserver.observe({ entryTypes: ["measure"] });