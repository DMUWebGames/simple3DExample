import { System } from "./base.js";
import { createShader } from "../../shader.js";
import { device } from "../../setup.js";
import { ComputeSystem } from "./compute.js";

const transformShader = await createShader("transform.wgsl");

export class TransformSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "transform system",
            module: transformShader,
            groups: [["Position", "Orientation", "Scale", "Transform"]]
        }, ctx);
    }
}
