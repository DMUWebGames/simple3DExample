import { canvas } from "./js/setup.js";
import Scene from "./js/scene.js";
import Thing from "./js/thing.js";

function createThing(radius) {
    return Thing.random({radius});
}

const radius = 90;
const nThings = 1000;
const things = Array.from({length: nThings}, () => createThing(radius));
const scene = new Scene(radius, things, createThing);

scene.animate();

window.scene = scene;
window.canvas = canvas;