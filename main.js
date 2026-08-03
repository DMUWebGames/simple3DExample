import { performanceObserver } from "./js/performance.js";
import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 10,
    nCrates: 1,
    nAsteroids: 0
});

globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize());
globalThis.dispatchEvent(new Event("resize"));
console.log("scene created", scene);

scene.animate();


performanceObserver.observe({ entryTypes: ["measure"] });