import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const gravityShader = await createShader("gravity.wgsl");

export class GravitySystem extends ComputeSystem {
    constructor(ctx) {
        super({
            label: "gravity system",
            module: gravityShader,
            groups: [["Force", "Mass", "Position", "gravityConfig"]]
        }, ctx);
    }

    update({ world, device }) {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({ label: this.label });
        pass.setPipeline(this.pipeline);
        for (const id in this.bindgroups) {
            pass.setBindGroup(id, this.bindgroups[id]);
        }
        const dispatchCount = Math.ceil(world.maxEntities / 64);
        pass.dispatchWorkgroups(dispatchCount, dispatchCount, 1);
        pass.end();
        device.queue.submit([encoder.finish()]);
    }
}
