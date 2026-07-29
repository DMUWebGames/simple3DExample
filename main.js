import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 500,
    nCubes: 2000,
    nAsteroids: 200
});
globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize());
globalThis.dispatchEvent(new Event("resize"))
scene.animate();

const stats = new Map();
const n = 1000;

const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        const values = stats.getOrInsert(entry.name, [])
        values.push(entry.duration);
        if (values.length >= n) {
            const total = values.reduce((p, c) => p + c, 0);
            console.log(`${entry.name} average (${values.length})`, total / values.length);
            stats.delete(entry.name);
        }
  });
});
observer.observe({ entryTypes: ["measure"] });