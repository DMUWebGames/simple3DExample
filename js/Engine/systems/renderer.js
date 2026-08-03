// import { format, ctx } from "../../setup.js";


export class Renderer {
    constructor({ buffers, device, canvas }) {
        this.device = device;
        this.sampler = device.createSampler();
        // this.renderables = renderables;
        this.pipelines = new Map();
        this.bindGroups = new Map();
        this.depthTexture = null;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.ctx = canvas.getContext('webgpu');
        this.ctx.configure({
            device,
            format: this.format,
            alphamode: "premultiplied"
        });
        
    }

    createPipeline(material) {
        return this.device.createRenderPipeline({
            label: `renderer`,
            layout: "auto",
            vertex: {
                module: material.module,
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
                module: material.module,
                entryPoint: "fsMain",
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: material.cullmode || "none"
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


    getPipeline(material) {
        if (!this.pipelines.has(material)) {
            this.pipelines.set(material, this.createPipeline(material))
        }
        return this.pipelines.get(material);
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

    update({ buffers, renderables, device }) {

        const transformBuffer = buffers.get('Transform');
        const renderCameraBuffer = buffers.get("RenderCamera");
        const activeCameraBuffer = buffers.get("activeCamera");
        const lightBuffer = buffers.get("phongLight");

        if (!lightBuffer) {
            console.log("no light buffer found");
            return;
        }

        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment
        });


        for (const { id, resource } of renderables) {
            
            // this is too much coupling to the scene logic
            // can probably be fixed with a custom object for renderables
            const bufferKey = `renderableIndices_${id}`;

            const indexBuffer = buffers.get(bufferKey);
            if (!indexBuffer) continue;
            const { vertexBuffer, vertexCount, material } = resource;            

            // setup a pipeline
            const pipeline = this.getPipeline(material);
            
            // TODO: surely bindgroups can be created once and reused?

            // bind the instance, camera and light data to the pipeline

            const sceneKey = `${id}_scene`;
            if (!this.bindGroups.has(sceneKey)) {
                this.bindGroups.set(sceneKey, device.createBindGroup({
                    label: sceneKey,
                    layout: pipeline.getBindGroupLayout(1),
                    entries: [
                        { binding: 0, resource: { buffer: lightBuffer } },
                        { binding: 1, resource: this.sampler },
                        { binding: 2, resource: { buffer: renderCameraBuffer } },
                        { binding: 3, resource: { buffer: activeCameraBuffer } }
                    ]
                }));
            }
            const sceneWideBindGroup = this.bindGroups.get(sceneKey);

            // bind instances
            const instanceKey = `${id}_instances`;
            if (!this.bindGroups.has(instanceKey)) {
                this.bindGroups.set(instanceKey, device.createBindGroup({
                    label: instanceKey,
                    layout: pipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: indexBuffer } },
                        { binding: 1, resource: { buffer: transformBuffer } },
                    ]
                }));
            }
            const instanceBindGroup = this.bindGroups.get(instanceKey);
            
            // bind the material textures to the pipeline
            const textureKey = `${id}_textures`;
            if (!this.bindGroups.has(textureKey)) {
                this.bindGroups.set(textureKey, device.createBindGroup({
                    layout: pipeline.getBindGroupLayout(2),
                    entries: material.textures.map((t, i) => {
                        return { binding: i, resource: t }
                    })
                }));
            }
            const textureBindGroup = this.bindGroups.get(textureKey)

            // Setup the render pass and draw the mesh with the instance data
            renderPass.setPipeline(pipeline);
            renderPass.setBindGroup(0, instanceBindGroup);
            renderPass.setBindGroup(1, sceneWideBindGroup);
            renderPass.setBindGroup(2, textureBindGroup);
            renderPass.setVertexBuffer(0, vertexBuffer);
            renderPass.draw(vertexCount, indexBuffer.size / 4, 0, 0);
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }
}
