import { SpaceScene } from "./js/scenes/space.js";

const scene = new SpaceScene(100, 2000, 2000);
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
