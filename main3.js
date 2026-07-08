import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 50,
    nCubes: 1000,
    nAsteroids: 1000
});
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
window.dispatchEvent(new Event("resize"))
scene.animate(0);
