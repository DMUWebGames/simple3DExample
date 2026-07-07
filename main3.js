import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 100,
    nCubes: 1000,
    nAsteroids: 1000
});
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
