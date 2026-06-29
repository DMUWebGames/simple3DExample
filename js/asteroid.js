import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import { randomOrientation, randomDirection, randomInSphere } from './tools.js';
import { canvas } from "./setup.js";


export default class Asteroid {

    static random({center=vec3.create(0, 0, 0), radius=10000, maxCrossTimeInSeconds=10000, size=1}) {
        const location = randomInSphere(radius);
        vec3.add(location, center, location);
        const speed = (radius * 2) / maxCrossTimeInSeconds * Math.random();   // units per second
        const velocity = randomDirection();
        vec3.mulScalar(velocity, speed, velocity);
        return new Asteroid(location, randomOrientation(), vec3.create(size,size,size), velocity);
    }

    constructor(location, orientation, scale, velocity) {
        this.location = location;
        this.orientation = orientation;
        this.angle = Math.random() * 2 * Math.PI;
        this.scale = scale;

        // movement
        this.velocity = velocity;
        this.rotationSpeed = 1;
    }

    get matrix() {
        const result = mat4.identity();
        mat4.translate(result, this.location, result);
        mat4.rotate(result, this.orientation, this.angle, result);
        mat4.scale(result, this.scale, result);
        return [...result];
    }

    distanceFrom(point) {
        return vec3.distance(this.location, point);
    }

    wrapAround(cameraLocation, radius) {
        const toMe = vec3.subtract(this.location, cameraLocation);
        vec3.normalize(toMe, toMe);
        vec3.mulScalar(toMe, -radius * 0.95, toMe);
        vec3.add(cameraLocation, toMe, this.location);
    }

    stop() {
        this.velocity = vec3.create(0, 0, 0);
    }

    update(elapsed) {
        this.location[0] += this.velocity[0] * elapsed;
        this.location[1] += this.velocity[1] * elapsed;
        this.location[2] += this.velocity[2] * elapsed;
        this.angle += this.rotationSpeed * elapsed;
    }
}

