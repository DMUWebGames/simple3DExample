class NoInstancesWarning extends Error {
    constructor(message, options) {
        const { entry } = options;
        super(message, options);
        this.entry = entry;
    }
};



export class RenderSystem { 
    constructor(config, { buffers, device, canvas, models }) { 
        this.label = config.label;
        this.device = device;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.ctx = canvas.getContext('webgpu');
        this.ctx.configure({
            device,
            format: this.format,
            alphamode: "premultiplied"
        });
        this.depthTexture = null;
        this.sampler = device.createSampler();
        this.pipelines = new Map();
        for (const model of models) {
            try {
                this.pipelines.set(model.name, new RenderPipeline(config.groups, model, {
                    sampler: this.sampler,
                    format: this.format,
                    buffers, device
                }));
            } catch (err) {
                if (err instanceof NoInstancesWarning) {
                    console.warn(err.message, err.entry);
                } else {
                    throw err;
                }
            }
        }
    }

    resize(canvas) {
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }
        this.depthTexture = this.device.createTexture({
            label: "depth texture",
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthStencilAttachment = {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        };
    }

    update({ device }) {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            label: this.label,
            colorAttachments: [{
                view: this.ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment
        });
        for (const pipeline of this.pipelines.values()) {
            pipeline.render(pass);
        }
        pass.end();
        device.queue.submit([encoder.finish()]);
    }


}


class RenderPipeline {
    constructor(groups, model, { sampler, format, buffers, device }) {
        const { id, name, resource: { material, vertexBuffer, vertexCount } } = model;
        const { module, textures, cullmode } = material
        this.id = id;
        this.name = name;
        this.module = module;
        this.textures = textures;
        this.sampler = sampler;
        this.cullmode = cullmode;
        this.vertexBuffer = vertexBuffer;
        this.vertexCount = vertexCount;
        this.format = format;
        this.buffers = buffers;
        this.device = device;
        this.pipeline = this.createPipeline(device);
        this.bindGroups = this.initBindGroups(groups);
    }

    initBindGroups(groups) {
        const result = groups.map(this.createBindGroup.bind(this));
        const textureGroup = this.device.createBindGroup({
            label: `${this.name} texture bindings`,
            layout: this.pipeline.getBindGroupLayout(groups.length),
            entries: this.textureBindings()
        });
        result.push(textureGroup);
        return result;
    }

    textureBindings() {
        return [...this.textures.map((t, i) => {
            return { binding: i, resource: t };
        }), { binding: this.textures.length, resource: this.sampler }];
    }

    bgEntry(_entry, i) {
        let entry
        if (typeof _entry != "object") {
            entry = { type: "normal", key: _entry };
        } else {
            entry = { ..._entry };
        }
        if (entry.type == "index") {
            entry.key = entry.key(this.id);
        }
        const buffer = this.buffers.get(entry.key);
        if (entry.type == "index") { 
            try {
                this.instanceCount = buffer.size / 4 || 0;
            } catch (err) {
                throw new NoInstancesWarning(`${entry.key} has no data`, {cause: err, entry});
            }
        }
        return { binding: i, resource: { buffer } }
    }

    createBindGroup(group, n) {
        return this.device.createBindGroup({
            label: `${this.name} bg${n}`,
            layout: this.pipeline.getBindGroupLayout(n),
            entries: group.map(this.bgEntry.bind(this))
        });
    }

    createPipeline(device) {
        return device.createRenderPipeline({
            label: `${this.name} pipeline`,
            layout: "auto",
            vertex: {
                module: this.module,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: 32,
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: "float32x3" },
                            { shaderLocation: 1, offset: 12, format: "float32x2" },
                            { shaderLocation: 2, offset: 20, format: "float32x3" },
                        ]
                    }
                ]
            },
            fragment: {
                module: this.module,
                entryPoint: "fsMain",
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: this.cullmode || "none"
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less",
                stencil: {},
                bias: {},
            },
        });
    }

    render(pass) {
        pass.setPipeline(this.pipeline);
        this.bindGroups.forEach((bg, i) => { 
            pass.setBindGroup(i, bg);
        })
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertexCount, this.instanceCount, 0, 0);        
    }
}

