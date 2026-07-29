import { System } from "./base.js";
import { device } from "../../setup.js";
import { vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { createShader } from "../../shader.js";

const movementShader = await createShader('movement.wgsl');

export class MovementSystem extends System {
    constructor(world, size) {
        super({ Position: null, Velocity: null });
        this.size = size;
        this.pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: movementShader,
                entryPoint: "main"
            }
        });
    }

    update({world, deltaTime, activeEntities, buffers}) {

        const positionBuffer = buffers.get("Position");
        const velocityBuffer = buffers.get("Velocity");
        const deltaTimeBuffer = buffers.get("deltaTime");
        const sizeBuffer = buffers.get("size");

        // create compute pipeline
        const pipeline = this.pipeline;
        const bindgroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: positionBuffer } },
                { binding: 1, resource: { buffer: velocityBuffer } },
                { binding: 2, resource: { buffer: deltaTimeBuffer } },
                { binding: 3, resource: { buffer: sizeBuffer } }
            ]
        });

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({
            label: "movement system"
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindgroup);
        pass.dispatchWorkgroups(Math.ceil(world.maxEntities / 64));
        pass.end();

        device.queue.submit([encoder.finish()]);


    }
}
