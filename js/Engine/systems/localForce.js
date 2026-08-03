import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const localForceShader = await createShader("localForce.wgsl");

export class LocalForceSystem extends ComputeSystem {
    constructor(ctx) {
        super({
            label: "local force system",
            module: localForceShader,
            groups: [["Force", "Thrust", "Orientation"]]
        }, ctx);
    }
}