import { System } from "./base.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const movementShader = await createShader('movement.wgsl');

export class MovementSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "movement system",
            module: movementShader,
            groups: [["Position", "Velocity", "deltaTime", "size"]]
        }, ctx);
    }
}
