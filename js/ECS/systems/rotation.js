import { System } from "./base.js";
import { quat } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";

const rotationShader = await createShader('rotation.wgsl');

export class RotationSystem extends System {
    constructor() {
        super({ Orientation: null, Rotation: null });
        this.pipeline = device.createComputePipeline({
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
        return device.createBuffer({
            label: `${component} instances`,
            size: instances.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });            
    }


    update(world, deltaTime, activeEntities) {
        const orientationBuffer = world.getOrRegisterGPUBuffer("orientations", () => {
            return this.createComponentBuffer(world, "Orientation", activeEntities);
        });
        const rotationBuffer = world.getOrRegisterGPUBuffer("rotations", () => {
            return this.createComponentBuffer(world, "Rotation", activeEntities);
        });
        const deltaTimeBuffer = world.getGPUBuffer("deltaTime");

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
        pass.dispatchWorkgroups(Math.ceil(this.entityCount / 64));
        pass.end();

        device.queue.submit([encoder.finish()]);

        // const query = world.query(['Orientation', "Rotation"]);
        // const matchingEntities = query.filter(activeEntities, world.signatures);

        // for (const entityId of matchingEntities) {
        //     const orientation = world.getComponent(entityId, "Orientation");
        //     const rotation = world.getComponent(entityId, "Rotation");
        //     const frameDelta = quat.slerp(quat.identity(), rotation, deltaTime);
        //     const newOrientation = quat.create();
        //     quat.mul(orientation, frameDelta, newOrientation);
        //     quat.normalize(newOrientation, newOrientation);
        //     world.updateComponent(entityId, "Orientation", newOrientation);
        // }
    }

    resize() { }
}

