import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

export default class Camera {
    constructor(canvas) {
        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();

        // View: Move the camera back by 3 units on the Z-axis
        // LookAt parameters: (cameraPosition, targetPosition, upVector)
        mat4.lookAt(vec3.create(0, 0, 3), vec3.create(0, 0, 0), vec3.create(0, 1, 0), this.viewMatrix);
        this.update(canvas);
    }

    update(canvas) {
        const aspect = canvas.width / canvas.height;
        mat4.perspective((60 * Math.PI) / 180, aspect, 0.1, 100.0, this.projMatrix);
    }

    get data() {
        return new Float32Array([...this.viewMatrix, ...this.projMatrix]);
    }


}