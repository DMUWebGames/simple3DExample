import { System } from "./base.js";
import { device } from "../../setup.js";
import { vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { createShader } from "../../shader.js";

const movementShader = await createShader('movement.wgsl');

export class MovementSystem extends System {
    constructor(size) {
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

    createComponentBuffer(world, component, activeEntities) {
        const query = world.query(['Position', 'Velocity']);
        const matchingEntities = query.filter(activeEntities, world.signatures);
        this.entityCount = matchingEntities.length;
        const instances = world.exportComponentData(component, matchingEntities);
        return device.createBuffer({
            label: `${component} instances`,
            size: instances.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });            
    }

    update(world, deltaTime, activeEntities) {
        const positionBuffer = world.getOrRegisterGPUBuffer("positions", () => this.createComponentBuffer(world, "Position", activeEntities));
        const velocityBuffer = world.getOrRegisterGPUBuffer("velocities", () => this.createComponentBuffer(world, "Velocity", activeEntities));
        const deltaTimeBuffer = world.getGPUBuffer("deltaTime");
        const sizeBuffer = world.getOrRegisterGPUBuffer("size", () => {
            return device.createBuffer({
                label: "size buffer",
                size: 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });            
        });

        // update uniform buffers (size doesn't change often but were updating it anyway)
        // device.queue.writeBuffer(deltaTimeBuffer, 0, new Float32Array([deltaTime]));
        device.queue.writeBuffer(sizeBuffer, 0, new Float32Array([this.size]));

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
        pass.dispatchWorkgroups(Math.ceil(this.entityCount / 64));
        pass.end();

        device.queue.submit([encoder.finish()]);

        // // CPU does calculation in a simple loop
        // for (const entityId of matchingEntities) {
        //     const position = world.getComponent(entityId, "Position");
        //     const velocity = world.getComponent(entityId, "Velocity");

        //     // move it
        //     vec3.add(position, vec3.mulScalar(velocity, deltaTime), position)

        //     // wrap if necessary
        //     if(vec3.length(position) > this.size) {
        //         vec3.negate(position, position);
        //     }

        //     // write back to component
        //     world.updateComponent(entityId, "Position", position);
        // }
    }
}
