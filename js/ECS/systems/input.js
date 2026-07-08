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
            "a": "-roll",
            "s": "break",
            "d": "+roll",
        }
        this.controls = {};
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
        canvas.addEventListener("click", () => {
            if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                this.mouseDelta = { x: 0, y: 0 };
            }
        });
        canvas.addEventListener("mousemove", ev => {
            if (document.pointerLockElement === canvas) {
                this.mouseDelta.x += ev.movementX;
                this.mouseDelta.y += ev.movementY;
            }
        });
    }

    update(world, deltaTime, activeEntities) {
        const playerId = world.getResource("activePlayerEntity");
        const roll = world.getComponent(playerId, "Roll");
        const pitch = world.getComponent(playerId, "Pitch");
        const yaw = world.getComponent(playerId, "Yaw");
        // console.log(this.mouseDelta);
        

        // const up = world.getComponent(playerId, "Up");
        // const right = world.getComponent(playerId, "Right");
        // const forward = world.getComponent(playerId, "Forward");
        // console.log(orientation);
        
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