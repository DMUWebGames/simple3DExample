import { Scene } from "./js/scene.js";
import { Thing } from "./js/thing.js";

const things = [
    Thing.at(-1, -1, 0),
    Thing.at(-1, 1, 0),
    Thing.at(1, -1, 0),
    Thing.at(1, 1, 0)
]
const scene = new Scene(things);

console.log(scene);

scene.render()