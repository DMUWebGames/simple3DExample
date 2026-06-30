import { canvas } from "./js/setup.js";
import Scene from "./js/scene.js";
import Asteroid from "./js/asteroid.js";
import { Cube } from "./js/cube.js";

// size of the world
const radius = 1000000;

// Minimum speed of things, how long they take to cross the world
const maxCrossTimeInSeconds = 10000;

// Size of things
const asteroidSize = 1000;
const cubeSize = 10000;

// Number of things
const nAsteroids = 10000;
const nCubes = 10;

// resolution of the thing vetices
const segmentCount = 16;

// Create things and add them to the scene
const things = Array.from({length: nAsteroids}, () => Asteroid.random({radius, maxCrossTimeInSeconds, size: asteroidSize}));

const cubes = Array.from({length: nCubes}, (_, i) => {
    return Cube.random({radius, maxCrossTimeInSeconds, size: cubeSize});
});

const scene = new Scene(radius, things, cubes, segmentCount);

scene.animate();

window.scene = scene;
window.canvas = canvas;