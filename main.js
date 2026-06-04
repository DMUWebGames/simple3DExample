import { Scene } from "./js/scene.js";
import { Thing } from "./js/thing.js";
import { canvas } from "./js/setup.js";

const things = [
    Thing.at(0, 0, 0),
    // Thing.at(0, canvas.height, 0),
    // Thing.at(canvas.width, 0, 0),
    // Thing.at(canvas.width, canvas.height, 0)
]
const scene = new Scene(things);

// scene.render();
scene.animate();
