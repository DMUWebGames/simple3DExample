import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

function randomOrientation(tm) {
    tm = mat4.rotateX(tm, 4 * Math.PI * (Math.random() - 0.5));
    tm = mat4.rotateY(tm, 4 * Math.PI * (Math.random() - 0.5));
    return mat4.rotateZ(tm, 4 * Math.PI * (Math.random() - 0.5));
}

function randomTranslation() {    
    return mat4.translation([
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        0.25,        
    ]);
}

export class Thing {

    static at(x, y, z) {
        // specified position
        const location = mat4.translation([x, y, z]);
        const orientation = randomOrientation(mat4.identity());

        // random movement
        const translation = randomTranslation();
        const rotation = randomOrientation(mat4.identity());
        return new Thing(location, orientation, translation, rotation);

    }
    static random() {

        // random position
        const location = randomTranslation()
        const orientation = randomOrientation(mat4.identity());

        // random movement
        const translation = randomTranslation();
        const rotation = randomOrientation(mat4.identity());
        return new Thing(location, orientation, translation, rotation);
    }

    constructor(location, orientation, translation, rotation) {
        this.location = location;
        this.orientation = orientation;
        this.translation = translation;
        this.rotation = rotation;
    }

    get data() {
        return Array.from(this.location);
    }

    update() {

    }
}