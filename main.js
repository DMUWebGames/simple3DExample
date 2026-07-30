import { SpaceScene } from "./js/scenes/space.js";
import { statsList } from "./js/setup.js";

const scene = new SpaceScene({
    size: 1000,
    nCrates: 250000,
    nAsteroids: 1000
});
globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize());
globalThis.dispatchEvent(new Event("resize"))
scene.animate();

const stats = new Map();
const n = 60;

const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        const key = entry.name.replace(" ", "-");
        const hasDt = statsList.querySelector(`dt.${key}`);
        if (!hasDt) {
            const dt = document.createElement("dt");
            const dd = document.createElement("dd");
            dd.classList.add(key);
            dt.classList.add(key);
            dt.textContent = entry.name;
            statsList.append(dt, dd);
        }
        const values = stats.getOrInsert(entry.name, [])
        values.push(entry.duration);
        if (values.length >= n) {
            const total = values.reduce((p, c) => p + c, 0);
            const dd = statsList.querySelector(`dd.${key}`);
            dd.textContent = total / values.length;
            stats.delete(entry.name);
        }
  });
});
observer.observe({ entryTypes: ["measure"] });