import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import { randomOrientation, randomTranslation } from './tools.js';
import { canvas } from "./setup.js";


export default class Thing {

    static at(x, y, z, dx, dy, dz, size=1) {
        // specified position
        const location = vec3.create(x, y, z);
        const orientation = vec3.create(0, 0, 0);
        const scale = vec3.create(size, size, size);

        // random movement
        const translation = vec3.create(dx, dy, dz);//randomTranslation();
        const rotation = randomOrientation();
        return new Thing(location, orientation, scale, translation, rotation);

    }

    static random() {
        return Thing.at(
            (Math.random() - 0.5) * canvas.width, 
            (Math.random() - 0.5) * canvas.height,
            (Math.random() - 0.5) * 1000,
            Math.random() - 0.5, 
            Math.random() - 0.5,
            Math.random() - 0.5,
            0.1 + Math.random() * 0.9
        );

    }

    constructor(location, orientation, scale, translation, rotation) {
        this.location = location;
        this.orientation = orientation;
        this.scale = scale;

        // movement
        this.translation = translation;
        this.rotation = rotation;
    }

    get matrix() {
        const result = mat4.identity();
        mat4.scale(result, this.scale, result);
        mat4.translate(result, this.location, result);
        mat4.rotateX(result, this.orientation[0], result);
        mat4.rotateY(result, this.orientation[1], result);
        mat4.rotateZ(result, this.orientation[2], result);
        return [...result];
    }

    update(elapsed) {
        console.log(`elapsed: ${elapsed}`);
        this.location[0] += this.translation[0] * elapsed;
        this.location[1] += this.translation[1] * elapsed;
        this.location[2] += this.translation[2] * elapsed;
        this.orientation[0] += this.rotation[0];
        this.orientation[1] += this.rotation[1];
        this.orientation[2] += this.rotation[2];
        const distance = Math.sqrt(this.location[0] ** 2 + this.location[1] ** 2 + this.location[2] ** 2);
        this.dead = distance > 5000;
    }
}