import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const forceShader = await createShader('force.wgsl');

export class ForceSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "force system",
            module: forceShader,
            groups: [["Velocity", "Force", "Mass", "deltaTime"]]
        }, ctx);
    }
}
