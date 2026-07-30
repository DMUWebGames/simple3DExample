import { System } from "./base.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";

const rotationShader = await createShader('rotation.wgsl');

export class RotationSystem extends System {
    constructor() {
        super({ Orientation: null, Rotation: null });
        this.pipeline = device.createComputePipeline({
            label: "rotation system",
            layout: "auto",
            compute: {
                module: rotationShader,
                entryPoint: "main"
            }
        })
    }

    createComponentBuffer(world, component, activeEntities) {
        const query = world.query(['Orientation', 'Rotation']);
        const matchingEntities = query.filter(activeEntities, world.signatures);
        this.entityCount = matchingEntities.length;
        const instances = world.exportComponentData(component, matchingEntities);
        const buffer = device.createBuffer({
            label: `${component} instances`,
            size: instances.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(buffer, 0, instances);               
        return buffer;
    }


    update({world, buffers}) {
        const orientationBuffer = buffers.get("Orientation");
        const rotationBuffer = buffers.get("Rotation");
        const deltaTimeBuffer = buffers.get("deltaTime");

        // const pipeline = this.pipeline;
        const bindgroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: orientationBuffer } },
                { binding: 1, resource: { buffer: rotationBuffer } },
                { binding: 2, resource: { buffer: deltaTimeBuffer } }
            ]
        });

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({
            label: "rotation system"
        });

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, bindgroup);
        pass.dispatchWorkgroups(Math.ceil(world.maxEntities / 64));
        pass.end();

        device.queue.submit([encoder.finish()]);
    }
}

