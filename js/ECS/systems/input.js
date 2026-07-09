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

export class InputSystem extends System {
    constructor(canvas) {
        super();
        this.keyMappings = {
            "w": "thrust",
            "a": "rollLeft",
            "s": "break",
            "d": "rollRight",
        }
        this.controls = {
            thrust: false,
            rollLeft: false,
            break: false,
            rollRight: false,
            pitch: 0,
            yaw: 0,
        };
        this.yawSpeed = 1.5;   // radians per second
        this.pitchSpeed = 1.2;
        this.rollSpeed = 1.0;

        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
        canvas.addEventListener("click", () => {
            if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        });
        canvas.addEventListener("mousemove", ev => {
            if (document.pointerLockElement === canvas) {
                this.controls.yaw = ev.movementX;
                this.controls.pitch = ev.movementY;
            }
        });
    }

    get rollDelta() { 
        return this.rollSpeed * (this.controls.rollRight - this.controls.rollLeft); 
    }

    get pitchDelta() { 
        return this.pitchSpeed * this.controls.pitch; 
    }

    get yawDelta() { 
        return this.yawSpeed * this.controls.yaw; 
    }

    update(world, deltaTime, activeEntities) {
        const playerId = world.getResource("activePlayerEntity");
        // const [yaw, pitch, roll] = world.getComponent(playerId, "Input");
        world.updateComponent(playerId, "Input", [
            this.yawDelta,
            this.pitchDelta,
            this.rollDelta
        ]);
    }

    onKeyDown(ev) { 
        const command = this.keyMappings[ev.key];
        if(command) this.controls[command] = true;
    }

    onKeyUp(ev) { 
        const command = this.keyMappings[ev.key];
        if(command) this.controls[command] = false;
    }
}