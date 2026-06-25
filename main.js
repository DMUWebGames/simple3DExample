import { canvas } from "./js/setup.js";
import Scene from "./js/scene.js";
import Thing from "./js/thing.js";
import { Cube } from "./js/cube.js";

// size of the world
const radius = 1000000;

// Minimum speed of things, how long they take to cross the world
const maxCrossTimeInSeconds = 10000;

// Size of things
const asteroidSize = 1000;
const cubeSize = 10;

// Number of things
const nThings = 2000;

// resolution of the thing vetices
const segmentCount = 16;

// Create things and add them to the scene
const things = Array.from({length: nThings}, () => Thing.random({radius, maxCrossTimeInSeconds, size: asteroidSize}));

const cubes = Array.from({length: 50}, (_, i) => Cube.place(500 + (i * 400), 200))

const scene = new Scene(radius, things, cubes, segmentCount);

scene.animate();

window.scene = scene;
window.canvas = canvas;