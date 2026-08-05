import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const torqueShader = await createShader('torque.wgsl');

export class TorqueSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "torque system",
            module: torqueShader,
            groups: [["Torque", "AngularVelocity", "Mass", "deltaTime"]]
        }, ctx);
    }
}

