import { device, format, ctx, canvas } from "../../setup.js";

const sampler = device.createSampler();

export class Renderer {
    constructor(renderables) {
        this.renderables = renderables;
        this.pipelines = new Map();
        this.depthTexture = null;
    }

    createPipeline(material) {
        return device.createRenderPipeline({
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
                targets: [{ format }]
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

    resize() {
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    update({ buffers, renderables }) {

        
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
                view: ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            }
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

            // bind instances
            const instanceBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: indexBuffer } },
                    { binding: 1, resource: { buffer: transformBuffer } },
                ]
            });

            // bind the instance, camera and light data to the pipeline
            const sceneWideBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(1),
                entries: [
                    // { binding: 0, resource: { buffer: instanceBuffer } },
                    // { binding: 0, resource: { buffer: cameraBuffer } },
                    { binding: 1, resource: { buffer: lightBuffer } },
                    { binding: 2, resource: sampler },
                    { binding: 3, resource: { buffer: renderCameraBuffer } },
                    { binding: 4, resource: { buffer: activeCameraBuffer } }
                ]
            });
            
            // bind the material textures to the pipeline
            const textureBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(2),
                entries: material.textures.map((t, i) => {
                    return { binding: i, resource: t }
                })
            });

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
