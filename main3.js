import { TestScene } from "./js/scenes/test.js";

const scene = new TestScene(100, 100);
window.scene = scene;
window.addEventListener("resize", () => scene.resize());
scene.resize();
scene.animate(0);
