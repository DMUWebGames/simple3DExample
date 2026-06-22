import { canvas } from "./js/setup.js";
import Scene from "./js/scene.js";
import Thing from "./js/thing.js";

// size of the world
const radius = 1000000;

// Minimum speed of things, how long they take to cross the world
const maxCrossTimeInSeconds = 10000;

// Size of things
const size = 1000;

// Number of things
const nThings = 2000;

// resolution of the thing vetices
const segmentCount = 16;

// Create things and add them to the scene
const things = Array.from({length: nThings}, () => Thing.random({radius, maxCrossTimeInSeconds, size}));

const scene = new Scene(radius, things, segmentCount);

scene.animate();

window.scene = scene;
window.canvas = canvas;