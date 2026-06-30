import { vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

export class Transform {

    constructor(translation=vec3.create(0,0,0)) {
        this.translation = translation;
    }

}
