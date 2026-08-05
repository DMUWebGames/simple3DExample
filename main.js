import { performanceObserver } from "./js/performance.js";
import { SpaceScene } from "./js/scenes/space.js";

import { device, canvas } from "./js/setup.js";


const scene = await SpaceScene.create(device, canvas, {
    size: 100,
    nCrates: 0,
    nAsteroids: 100,
    asteroidSize: { min: 1, max: 1 },
    layers: [
        {
            label: "physics",
            systems: ["gravity", "localForce", "force", "torque", "movement", "rotation"]
        },
        {
            label: "transformations",
            systems: ["transform", "camera"]
        }
    ]
});

globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize(canvas));
globalThis.dispatchEvent(new Event("resize"));
console.log("scene created", scene);

scene.animate();

performanceObserver.observe({ entryTypes: ["measure"] });