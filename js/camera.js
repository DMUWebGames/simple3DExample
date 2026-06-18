import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

export default class Camera {
    constructor(canvas, radius) {
        this.location = vec3.create(0, 0, 0);
        this.up = vec3.create(0, 1, 0);
        this.focus = vec3.create(0, 0, 10);
        this.near = 0.1;
        this.far = radius;
        this.resize(canvas);

        // View: Move the camera back by 3 units on the Z-axis
        // LookAt parameters: (cameraPosition, targetPosition, upVector)
        // mat4.lookAt(this.location, this.focus, this.up, this.viewMatrix);
        // this.resize(canvas);
    }

    resize(canvas) {
        this.aspect = canvas.width / canvas.height;
    }

    get viewMatrix() {
        return mat4.lookAt(this.location, this.focus, this.up);
    }

    get projMatrix() {
        return mat4.perspective((60 * Math.PI) / 180, this.aspect, this.near, this.far);
    }

    get data() {
        return new Float32Array([...this.viewMatrix, ...this.projMatrix]);
    }


}