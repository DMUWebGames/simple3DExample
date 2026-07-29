import { System } from "./base.js";
import { createShader } from "../../shader.js";
import { device } from "../../setup.js";

const transformShader = await createShader("transform.wgsl");

export class TransformSystem extends System{ 

    constructor() {
        super({ Transform: null });
        this.pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: transformShader,
                entryPoint: "main"
            }
        });
    }

    update({world, buffers}) { 
        const positionBuffer = buffers.get("Position");
        const orientationBuffer = buffers.get("Orientation");
        const scaleBuffer = buffers.get("Scale");
        const transformBuffer = buffers.get("Transform");

        const bindgroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: positionBuffer } },
                { binding: 1, resource: { buffer: orientationBuffer } },
                { binding: 2, resource: { buffer: scaleBuffer } },
                { binding: 3, resource: { buffer: transformBuffer } }
            ]
        });

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({
            label: "transform system"
        });

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, bindgroup);
        pass.dispatchWorkgroups(Math.ceil(world.maxEntities / 64));
        pass.end();

        device.queue.submit([encoder.finish()]);
    }
}