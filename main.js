import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 50,
    nCubes: 50,
    nAsteroids: 50
});
globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize());
globalThis.dispatchEvent(new Event("resize"))
scene.animate();

const stats = new Map();
const n = 1000;

function perfObserver(list, observer) {
    list.getEntries().forEach((entry) => {
        const values = stats.getOrInsert(entry.name, [])
        // console.log(values.length);
        
        values.push(entry.duration);
        if (values.length >= n) {
            const total = values.reduce((p, c) => p + c, 0);
            // console.log("max", Math.max(...values));
            console.log(`${entry.name} average`, total / values.length);
            // console.log("min", Math.min(...values));
            stats.delete(entry.name);
        }
  });
}
const observer = new PerformanceObserver(perfObserver);
observer.observe({
  entryTypes: ["measure"], 
});