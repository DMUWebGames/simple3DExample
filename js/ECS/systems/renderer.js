import { System } from "./base.js";
import { device, format, ctx, canvas } from "../../setup.js";
import { Light } from "../../light.js";
import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

const sampler = device.createSampler();

const shaders = new Map();

export class Renderer extends System {
    constructor() {
        super({ 
            Renderable: 0,
            Transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
        });
        this.instanceBuffers = new Map();
        this.pipelines = new Map();
        this.depthTexture = null;
    }

    createPipeline(module) {
        return device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: module,
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
                module: module,
                entryPoint: "fsMain",
                targets: [{ format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "back"
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

    getPipeline(module) {
        
        if (!this.pipelines.has(module)) {
            console.log("creating pipeline for", module);
            this.pipelines.set(module, this.createPipeline(module))
        }
        return this.pipelines.get(module);
    }

    resize() {
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    update(world, deltaTime, activeEntities) {

        const renderableQuery = world.query(['Transform', 'Renderable']);
        const renderableEntities = renderableQuery.filter(activeEntities, world.signatures);

        if (!renderableEntities.length) {
            console.log("nothing to render");
            return;
        }

        const cameraBuffer = world.getResource("activeCameraBuffer");
        if (!cameraBuffer) {
            console.log("no camera buffer found");
            return;
        }

        const lightBuffer = world.getResource("activeLightBuffer");
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

        // Create a group of entities per mesh (renderable[0] is the mesh resourceId)
        const groups = Map.groupBy(renderableEntities, (entityId) => {
            return world.getComponent(entityId, "Renderable")[0];
        });

        if (!groups.size) {
            return;
        }

        for (const [renderableId, group] of groups) {
           

            // create an array to hold the transformation data
            const transforms = new Float32Array(group.length * 16);
            for (const i in group) {
                const entityId = group[i];
                const transform = world.getComponent(entityId, "Transform");
                transforms.set(transform, i * 16);
            }

            // See if we have a buffer already set up
            let instanceBuffer = this.instanceBuffers.get(renderableId);
            
            // create or expand the buffer as necessary
            if (!instanceBuffer || instanceBuffer.size < transforms.byteLength) {
                instanceBuffer = device.createBuffer({
                    size: transforms.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                });
                // so we can reuse buffers
                this.instanceBuffers.set(renderableId, instanceBuffer);
            }
            // write the data to the buffer
            device.queue.writeBuffer(instanceBuffer, 0, transforms);
            
            // load the renderable
            const {vertexBuffer, vertexCount, material} = world.getResourceById(renderableId);

            // setup a pipeline
            const pipeline = this.getPipeline(material.module);
            
            // bind the data to the pipeline
            const sceneWideBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: instanceBuffer } },
                    { binding: 1, resource: { buffer: cameraBuffer } },
                    { binding: 2, resource: { buffer: lightBuffer } },
                    { binding: 3, resource: sampler },
                ]
            });
            
            const textureBindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(1),
                entries: material.textures.map(t => {
                    return { binding: 0, resource: t }
                })
            });
            
            renderPass.setPipeline(pipeline);
            renderPass.setBindGroup(0, sceneWideBindGroup);
            renderPass.setBindGroup(1, textureBindGroup);
            renderPass.setVertexBuffer(0, vertexBuffer);
            renderPass.draw(vertexCount, group.length, 0, 0);
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }
}
