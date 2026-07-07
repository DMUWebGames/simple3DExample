import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene(1000, 100);
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
