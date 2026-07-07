import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene({
    size: 10,
    nCubes: 20,
    nAsteroids: 10
});
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
