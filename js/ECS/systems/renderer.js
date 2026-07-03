import { System } from "./base.js";
import { device, format, ctx, canvas } from "../../setup.js";
import { Light } from "../../light.js";
import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";

async function createShader(path) {
    const response = await fetch(path);
    const code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const cubeModule = await createShader("shaders/cube.wgsl");

export class Renderer extends System {
    constructor() {
        super({ Position: { x: 0, y: 0, z: 0 }, Renderable: { mesh: "" } });
        this.light = new Light();
        this.instanceBuffers = new Map();
        this.pipeline = this.createPipeline();
        this.depthTexture = null;
        this.cameraEntity = null;
    }

    createPipeline() {
        return device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: cubeModule,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: 24,
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: "float32x3" },
                            { shaderLocation: 1, offset: 12, format: "float32x3" },
                        ]
                    }
                ]
            },
            fragment: {
                module: cubeModule,
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

    createBindGroup(layout, instanceBuffer, cameraBuffer) {
        return device.createBindGroup({
            layout,
            entries: [
                { binding: 0, resource: { buffer: instanceBuffer } },
                { binding: 1, resource: { buffer: cameraBuffer } },
                { binding: 2, resource: { buffer: this.light.buffer(device) } },
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
        // console.log("render!");
        

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
        const meshNames = world.getResource("meshNames");

        // Create a group of entities per mesh
        const groups = Map.groupBy(renderableEntities, (entityId) => {
            const renderable = world.getComponent(entityId, "Renderable");
            return meshNames[renderable[0]];
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
        

        for (const [meshName, group] of groups) {
            const transforms = new Float32Array(group.length * 16);
            for (let i = 0; i < group.length; i++) {
                const entityId = group[i];
                const position = world.getComponent(entityId, "Position");
                const modelMatrix = mat4.identity();
                mat4.translate(modelMatrix, [position?.[0] ?? 0, position?.[1] ?? 0, position?.[2] ?? 0], modelMatrix);
                transforms.set(modelMatrix, i * 16);
            }

            let instanceBuffer = this.instanceBuffers.get(meshName);

            // buffer expands as necessary if length increases
            if (!instanceBuffer || instanceBuffer.size < transforms.byteLength) {
                instanceBuffer = device.createBuffer({
                    size: transforms.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                });
                // so we can reuse buffers
                this.instanceBuffers.set(meshName, instanceBuffer);
            }
            device.queue.writeBuffer(instanceBuffer, 0, transforms);

            const bindGroup = this.createBindGroup(
                this.pipeline.getBindGroupLayout(0),
                instanceBuffer,
                cameraBuffer
            );

            const mesh = world.getResource(meshName);

            renderPass.setBindGroup(0, bindGroup);
            renderPass.setVertexBuffer(0, mesh.vertexBuffer);
            renderPass.draw(mesh.vertexCount, group.length, 0, 0);
        }

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }
}
