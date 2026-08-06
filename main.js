import { performanceObserver } from "./js/performance.js";
import { SpaceScene } from "./js/scenes/space.js";

import { device, canvas } from "./js/setup.js";
import { randomInSphere, randomVector } from "./js/tools.js";

const size = 100000;

const entities = [{
    model: "skybox",
    scale: Array(3).fill(size),
    // orientation: randomQuat(),
    mass: 0.1
}, {
    scale: Array(3).fill(0.1),
    mass: 10,
    camera: {
        near: 0.1,
        far: size * 2,
        fov: 60
    }
}];

// I should specify a camera separately
// so it can become a named uniform buffer
// switching the camera should be done with a script
// camera can have an entity id to get position and orientation

const config = {
    size, 
    autoGenerate: [
        {
            length: 1000,
            conf: { size: { min: 100, max: 1000 } },
            f: (conf) => {
                const s = conf.size.min + Math.random() * (conf.size.max - conf.size.min);
                const mass = s * 100000000;
                const position = randomInSphere(size - s * 2);

                return {
                    model: "asteroid",
                    position,
                    velocity: randomVector(-10, 10),
                    torque: randomVector(-10 * mass, 10 * mass),
                    mass,
                    scale: Array(3).fill(s)
                }
            }
        },
        {
            length: 100000,
            conf: {
                size: {
                    min: 1,
                    max: 200
                }
            },
            f: (conf) => { 
                const s = conf.size.min + Math.random() * (conf.size.max - conf.size.min);
                return {
                    model: "crate",
                    position: randomInSphere(size),
                    velocity: randomVector(-10, 10),
                    angularVelocity: randomVector(-1, 1),
                    mass: 10000,
                    scale: Array(3).fill(s)
                }            
            }
        }
    ],
    crates: {
        n: 10000,
        size: { min: 1, max: 10 }
    },
    asteroids: {
        n: 1000,
        size: { min: 500, max: 1000 }
    },
    models: ["skybox", "crate", "asteroid"],
    uniforms: {
        size: new Float32Array([size]),
        gravityConfig: new Float32Array([
            10,          // G
            1,           // minDistance
            size / 50,   // maxDistance
            0            // pad
        ]),
        phongLight: new Float32Array([
            ...[Math.PI, Math.PI, Math.PI],//...randomDirection(),       // direction
            0,                          // pad
            0.9 + 0.1 * Math.random(),  // R
            0.9 + 0.1 * Math.random(),  // G
            0.9 + 0.1 * Math.random(),  // B
            0                           // pad
        ]),
        activeCamera: new Uint32Array([1])
    },
    entities,
    layers: [
        {
            label: "physics",
            systems: ["gravity", "localForce", "force", "torque", "movement", "rotation"]
        },
        {
            label: "transformations",
            systems: ["transform", "camera"]
        }
    ]
}

const scene = await SpaceScene.create(device, canvas, config);

globalThis.scene = scene;
globalThis.addEventListener("resize", () => scene.resize(canvas));
globalThis.dispatchEvent(new Event("resize"));
console.log("scene created", scene);

scene.animate();

performanceObserver.observe({ entryTypes: ["measure"] });