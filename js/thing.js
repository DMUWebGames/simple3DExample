import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import { randomOrientation, randomTranslation } from './tools.js';

export class Thing {

    static at(x, y, z) {
        // specified position
        const location = vec3.create(x, y, z);
        const orientation = vec3.create(0, 0, 0);
        const scale = vec3.create(.25, .25, .25);

        // random movement
        const translation = vec3.create(0.1, 0, 0);//randomTranslation();
        const rotation = vec3.create(0.01, 0.01, 0.01);//randomOrientation();
        return new Thing(location, orientation, scale, translation, rotation);

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
        mat4.rotate(result, this.orientation, result);

        // mat4.scale(result, vec3.create(0.5, 2.5, 0.5), result);
        // console.log(result);
        return [...result];
    }

    update() {
        // console.log(this.orientation);
        mat4.translate(this.location, this.translation, this.location);
        // this.orientation = mat4.multiply(this.orientation, this.rotation);
        console.log(this.location);
    }
}