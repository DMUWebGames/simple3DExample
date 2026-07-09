import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 5000,
    nCubes: 10000,
    nAsteroids: 10000
});
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
window.dispatchEvent(new Event("resize"))
scene.animate();

function perfObserver(list, observer) {
  list.getEntries().forEach((entry) => {
    // if (entry.entryType === "mark") {
    //   console.log(`${entry.name}'s startTime: ${entry.startTime}`);
    // }
    if (entry.entryType === "measure") {
      console.log(`${entry.name}'s duration: ${entry.duration}`);
    }
  });
}
const observer = new PerformanceObserver(perfObserver);
observer.observe({ entryTypes: ["measure", "mark"] });