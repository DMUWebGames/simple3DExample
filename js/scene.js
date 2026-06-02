// The scene manages everything
import { sphericalVertexBuffer, sphericalVertices } from "../sphere.js";
import { device, format, ctx } from "./setup.js";
import { Thing } from "./thing.js";

async function createShader(path, options) {
    const response = await fetch(path);
    let code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const module = await createShader('shaders/thing.wgsl');

export class Scene {
    constructor(nThings) {
        const [b, v] = sphericalVertexBuffer(device, 8);
        this.vertexBuffer = b;
        this.nVertices = v;
        this.things = Array.from({length: nThings}, () => Thing.random());
        const thingData = new Float32Array(this.things.map(thing => thing.data).flat());
        this.thingBuffer = device.createBuffer({
            size: thingData.byteLength,
            mappedAtCreation: true,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        new Float32Array(this.thingBuffer.getMappedRange()).set(thingData);
        this.thingBuffer.unmap();

        // pipeline
        this.renderPipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: 12, // 3 * 4 bytes (vec3<f32>)
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x3"
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module,
                entryPoint: "fsMain",
                targets: [{ format }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });

        this.renderBindGroup = device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.thingBuffer } }
            ]
        });
    }


    render(view) {
        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                clearValue: [0, 1, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.draw(this.nVertices / 3, this.things.length, 0, 0); // draw the cube

        renderPass.end();        
        device.queue.submit([encoder.finish()]);
    }
}