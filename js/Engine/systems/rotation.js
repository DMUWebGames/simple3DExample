import { System } from "./base.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const rotationShader = await createShader('rotation.wgsl');

export class RotationSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "rotation system",
            module: rotationShader,
            groups: [["Orientation", "Rotation", "deltaTime"]]
        }, ctx);
    }
}

