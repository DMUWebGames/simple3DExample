import { System } from "./base.js";
import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { createShader } from "../../shader.js";
import { device } from "../../setup.js";

// TODO: Perhaps I want this to be done in a compute shader?

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


        // const query = world.query(["Position", "Scale", "Orientation", "Transform"]);
        // const matchingEntities = query.filter(activeEntities, world.signatures);
        // this.updateCPU(world, deltaTime, matchingEntities);
    }

    updateCPU(world, deltaTime, matchingEntities) {
        // CPU version
        for (const entityId of matchingEntities) {
            const transform = world.getComponent(entityId, "Transform");
            const position = world.getComponent(entityId, "Position");
            const orientation = world.getComponent(entityId, "Orientation");
            const scale = world.getComponent(entityId, "Scale");

            mat4.multiply(
                mat4.translation(position),
                mat4.multiply(
                    mat4.fromQuat(orientation),
                    mat4.scaling(scale)
                ),
                transform
            );

            world.updateComponent(entityId, "Transform", transform);

        }
    }
}