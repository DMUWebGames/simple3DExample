import { System } from "./base.js";
import { vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

function rotateVectorAroundAxis(vector, axis, angle) {
    const normalizedAxis = vec3.normalize(vec3.create(axis[0], axis[1], axis[2]));
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const dot = vector[0] * normalizedAxis[0] + vector[1] * normalizedAxis[1] + vector[2] * normalizedAxis[2];

    return vec3.create(
        vector[0] * cosAngle + (normalizedAxis[1] * vector[2] - normalizedAxis[2] * vector[1]) * sinAngle + normalizedAxis[0] * dot * (1 - cosAngle),
        vector[1] * cosAngle + (normalizedAxis[2] * vector[0] - normalizedAxis[0] * vector[2]) * sinAngle + normalizedAxis[1] * dot * (1 - cosAngle),
        vector[2] * cosAngle + (normalizedAxis[0] * vector[1] - normalizedAxis[1] * vector[0]) * sinAngle + normalizedAxis[2] * dot * (1 - cosAngle)
    );
}

export class ControlSystem extends System {
    constructor() {
        super({ Keys: null, Mouse: null });
        this.controls = {}
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    update() { 

        // console.log(this.controls);
    }

    onKeyDown(ev) { 
        this.controls[ev.key] = true;
    }

    onKeyUp(ev) { 
        this.controls[ev.key] = false;

    }
}