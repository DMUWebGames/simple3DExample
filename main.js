import { canvas } from "./js/setup.js";
import Scene from "./js/scene.js";
import Thing from "./js/thing.js";

const radius = 500;
const maxCrossTimeInSeconds = 100;
const nThings = 10000;
const things = Array.from({length: nThings}, () => Thing.random({radius, maxCrossTimeInSeconds}));
const scene = new Scene(radius, things);

scene.animate();

window.scene = scene;
window.canvas = canvas;