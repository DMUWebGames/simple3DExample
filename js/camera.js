import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

export default class Camera {
    constructor(canvas, radius) {
        this.location = vec3.create(0, 0, 0);
        this.velocity = vec3.create(0, 0, 0);
        this.forward = vec3.create(0, 0, 1);
        this.up = vec3.create(0, 1, 0);
        this.right = vec3.create(1, 0, 0);
        this.near = 0.1;
        this.far = radius;
        this.thrustAcceleration = radius * 0.5;
        this.mouseSensitivity = 0.001;
        this.rollSpeed = 1.75;
        this.drag = 0;
        this.resize(canvas);
    }

    resize(canvas) {
        this.aspect = canvas.width / canvas.height;
    }

    rotateVectorAroundAxis(vector, axis, angle) {
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

    addMouseLook(deltaX, deltaY) {
        const yawAmount = -deltaX * this.mouseSensitivity;
        const pitchAmount = -deltaY * this.mouseSensitivity;

        this.forward = vec3.normalize(this.rotateVectorAroundAxis(this.forward, this.up, yawAmount));
        this.right = vec3.normalize(vec3.cross(this.forward, this.up));
        this.forward = vec3.normalize(this.rotateVectorAroundAxis(this.forward, this.right, pitchAmount));
        this.up = vec3.normalize(vec3.cross(this.right, this.forward));
    }

    addRoll(amount, elapsed) {
        const rollAmount = amount * this.rollSpeed * elapsed;
        this.up = vec3.normalize(this.rotateVectorAroundAxis(this.up, this.forward, rollAmount));
        this.right = vec3.normalize(vec3.cross(this.forward, this.up));
        this.up = vec3.normalize(vec3.cross(this.right, this.forward));
    }

    applyThrust(amount, elapsed) {
        const forward = vec3.create(this.forward[0], this.forward[1], this.forward[2]);
        vec3.mulScalar(forward, amount * this.thrustAcceleration * elapsed, forward);
        vec3.add(this.velocity, forward, this.velocity);
    }

    update(elapsed) {
        vec3.mulScalar(this.velocity, Math.max(0, 1 - this.drag * elapsed), this.velocity);
        vec3.add(this.location, vec3.mulScalar(this.velocity, elapsed, vec3.create()), this.location);
    }

    get viewMatrix() {
        const focus = vec3.add(this.location, this.forward, vec3.create());
        return mat4.lookAt(this.location, focus, this.up);
    }

    get projMatrix() {
        return mat4.perspective((60 * Math.PI) / 180, this.aspect, this.near, this.far);
    }

    get data() {
        return new Float32Array([...this.viewMatrix, ...this.projMatrix]);
    }


}