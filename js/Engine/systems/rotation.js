import { device } from "../../setup.js";
import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const rotationShader = await createShader('rotation.wgsl');

export class RotationSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "rotation system",
            module: rotationShader,
            groups: [["Orientation", "AngularVelocity", "deltaTime"]]
        }, ctx);
    }
}

