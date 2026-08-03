
export class ComputeSystem { 
    constructor(config, { buffers, device }) { 
        this.label = config.label;
        this.pipeline = device.createComputePipeline({
            label: config.label,
            layout: "auto",
            compute: {
                module: config.module,
                entryPoint: "main"
            }
        });

        this.bindgroups = config.groups.map((group, n) => { 
            return this.createBindGroup(n, group, buffers, device);
        })
    }

    createBindGroup(n, group, buffers, device) {
        return device.createBindGroup({
            label: `${this.label} bg${n}`,
            layout: this.pipeline.getBindGroupLayout(n),
            entries: group.map((b, i) => {
                return { binding: i, resource: { buffer: buffers.get(b) } }
            })
        });
    }

    update({world, buffers, device}) {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({ label: this.label });
        pass.setPipeline(this.pipeline);
        for (const id in this.bindgroups) {
            pass.setBindGroup(id, this.bindgroups[id]);
        }
        pass.dispatchWorkgroups(Math.ceil(world.maxEntities / 64));
        pass.end();
        device.queue.submit([encoder.finish()]);
    }


}
