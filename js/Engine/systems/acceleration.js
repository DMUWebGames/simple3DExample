import { System } from "./base.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const accelerationShader = await createShader('acceleration.wgsl');

export class AccelerationSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "acceleration system",
            module: accelerationShader,
            groups: [["Velocity", "Acceleration", "deltaTime"]]
        }, ctx);
    }
}
