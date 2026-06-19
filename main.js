import { canvas } from "./js/setup.js";
import Scene from "./js/scene.js";
import Thing from "./js/thing.js";

const radius = 10000;
const maxCrossTimeInSeconds = 1000;
const size = 5;
const nThings = 10000;
const things = Array.from({length: nThings}, () => Thing.random({radius, maxCrossTimeInSeconds, size}));
const scene = new Scene(radius, things);

scene.animate();

window.scene = scene;
window.canvas = canvas;