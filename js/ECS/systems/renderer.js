import { System } from "./base.js";
import { device, format, ctx, canvas } from "../../setup.js";
// import { Light } from "../../light.js";
// import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

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

    getInstanceBuffer(renderableId, instances) {
        let instanceBuffer = this.instanceBuffers.get(renderableId);
        if (!instanceBuffer) {
            instanceBuffer = device.createBuffer({
                size: instances.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });
            this.instanceBuffers.set(renderableId, instanceBuffer);
        }
        return instanceBuffer;
    }

    createPipeline(material) {
        return device.createRenderPipeline({
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
            console.log("creating pipeline for", material);
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

    update(world, deltaTime, activeEntities) {
        const transformBuffer = world.getGPUBuffer('transforms');
        const renderableQuery = world.query(['Transform', 'Renderable']);
        const renderableEntities = renderableQuery.filter(activeEntities, world.signatures);

        if (!renderableEntities.length) {
            console.log("nothing to render");
            return;
        }        

        // Create a group of entities per mesh (renderable[0] is the mesh resourceId)
        const groups = Map.groupBy(renderableEntities, (entityId) => {
            return world.getComponent(entityId, "Renderable")[0];
        });

        if (!groups.size) {
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

        for (const [renderableId, group] of groups) {
            const indexBuffer = world.getOrRegisterGPUBuffer(`transformIndices_${renderableId}`, () => {
                const groupData = new Uint32Array(group);
                const buffer = device.createBuffer({
                    label: `transformIndices_${renderableId}`,
                    size: groupData.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                });
                device.queue.writeBuffer(buffer, 0, groupData);               
                return buffer;
            });

            // load the transform data into a buffer
            // const transforms = world.exportComponentData("Transform", group);
            // const instanceBuffer = this.getInstanceBuffer(renderableId, transforms);
            // device.queue.writeBuffer(instanceBuffer, 0, transforms);
            
            // load the renderable
            const {vertexBuffer, vertexCount, material} = world.getResourceById(renderableId);

            // setup a pipeline
            const pipeline = this.getPipeline(material);

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
                    { binding: 0, resource: { buffer: cameraBuffer } },
                    { binding: 1, resource: { buffer: lightBuffer } },
                    { binding: 2, resource: sampler },
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
            renderPass.draw(vertexCount, group.length, 0, 0);
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }
}
