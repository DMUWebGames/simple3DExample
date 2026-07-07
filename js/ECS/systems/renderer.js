import { System } from "./base.js";
import { device, format, ctx, canvas } from "../../setup.js";
import { Light } from "../../light.js";
import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

async function createShader(path) {
    const response = await fetch(path);
    const code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const thingModule = await createShader("shaders/thing.wgsl");
const sampler = device.createSampler();



export class Renderer extends System {
    constructor() {
        super({ Position: { x: 0, y: 0, z: 0 }, Renderable: { mesh: "" }, Orientation: null });
        this.instanceBuffers = new Map();
        this.pipeline = this.createPipeline();
        this.depthTexture = null;
    }

    createPipeline() {
        return device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: thingModule,
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
                module: thingModule,
                entryPoint: "fsMain",
                targets: [{ format }]
            },
            primitive: {
                topology: "triangle-list"
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

    createBindGroup(layout, instanceBuffer, cameraBuffer, lightBuffer) {
        return device.createBindGroup({
            layout,
            entries: [
                { binding: 0, resource: { buffer: instanceBuffer } },
                { binding: 1, resource: { buffer: cameraBuffer } },
                { binding: 2, resource: { buffer: lightBuffer } },
                { binding: 3, resource: sampler },
                { binding: 4, resource: asteroidTexture }
            ]
        });
    }

    resize() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;

        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    update(world, deltaTime, activeEntities) {

        const renderableQuery = world.query(['Position', 'Renderable']);
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


        // Create a group of entities per mesh (renderable[0] is the mesh resourceId)
        const groups = Map.groupBy(renderableEntities, (entityId) => {
            return world.getComponent(entityId, "Renderable")[0];
        });

        if (!groups.size) {
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
        
        renderPass.setPipeline(this.pipeline);
        
        for (const [meshId, group] of groups) {
           
            // TODO: It looks like I'm applying the transformations here.
            // Can it be offloaded to a transformation system?
            // So I can just load the pre-built buffer here?
            // I guess ultimately I want this to be done in a compute shader

            // create an array to hold the transformation data
            const transforms = new Float32Array(group.length * 16);

            // fill the array
            for (const i in group) {//let i = 0; i < group.length; i++) {
                const entityId = group[i];
                const position = world.getComponent(entityId, "Position");
                const orientation = world.getComponent(entityId, "Orientation");
                const angle = world.getComponent(entityId, "Angle");
                const modelMatrix = mat4.identity();
                mat4.translate(modelMatrix, position, modelMatrix);
                if (orientation && angle) {
                    mat4.rotate(modelMatrix, orientation, angle, modelMatrix);
                }
                // mat4.scale(result, this.scale, result);

                transforms.set(modelMatrix, i * 16);
            }

            // See if we have a buffer already set up
            let instanceBuffer = this.instanceBuffers.get(meshId);
            
            // create or expand the buffer as necessary
            if (!instanceBuffer || instanceBuffer.size < transforms.byteLength) {
                instanceBuffer = device.createBuffer({
                    size: transforms.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                });
                // so we can reuse buffers
                this.instanceBuffers.set(meshId, instanceBuffer);
            }
            // write the data to the buffer
            device.queue.writeBuffer(instanceBuffer, 0, transforms);
            
            // load the renderable
            const mesh = world.getResourceById(meshId);

            // bind the data to the pipeline
            const bindGroup = device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: instanceBuffer } },
                    { binding: 1, resource: { buffer: cameraBuffer } },
                    { binding: 2, resource: { buffer: lightBuffer } },
                    { binding: 3, resource: sampler },
                    { binding: 4, resource: mesh.texture }
                ]
            });


            renderPass.setBindGroup(0, bindGroup);
            renderPass.setVertexBuffer(0, mesh.vertexBuffer);
            renderPass.draw(mesh.vertexCount, group.length, 0, 0);
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }
}
