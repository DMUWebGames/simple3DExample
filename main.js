import { Scene } from "./js/scene.js";
import Thing from "./js/thing.js";
import { canvas } from "./js/setup.js";

const scene = Scene.withNThings(500);

scene.animate();

window.scene = scene;
window.canvas = canvas;