import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import { randomOrientation, randomDirection, randomInSphere } from './tools.js';
import { canvas } from "./setup.js";


export default class Thing {

    static random({center=vec3.create(0, 0, 0), radius=100, maxCrossTimeInSeconds=10, size=1}) {
        const location = randomInSphere(radius);
        vec3.add(location, center, location);
        const speed = (radius * 2) / maxCrossTimeInSeconds * Math.random();   // units per second
        const translation = randomDirection();
        vec3.mulScalar(translation, speed, translation);
        return new Thing(location, randomOrientation(), vec3.create(size,size,size), translation);
    }

    constructor(location, orientation, scale, translation) {
        this.location = location;
        this.orientation = orientation;
        this.angle = Math.random() * 2 * Math.PI;
        this.scale = scale;

        // movement
        this.translation = translation;
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

    wrapAround(cameraLocation, radius=100) {
        const toMe = vec3.subtract(this.location, cameraLocation);
        vec3.normalize(toMe, toMe);
        vec3.mulScalar(toMe, -radius * 0.95, toMe);
        vec3.add(cameraLocation, toMe, this.location);
    }

    stop() {
        this.translation = vec3.create(0, 0, 0);
    }

    update(elapsed) {
        this.location[0] += this.translation[0] * elapsed;
        this.location[1] += this.translation[1] * elapsed;
        this.location[2] += this.translation[2] * elapsed;
        this.angle += this.rotationSpeed * elapsed;
    }
}