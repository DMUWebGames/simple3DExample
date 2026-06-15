// The scene manages everything
import { sphericalVertexBuffer } from "./sphere.js";
import { device, format, ctx, canvas } from "./setup.js";
import { Thing } from "./thing.js";

async function createShader(path, options) {
    const response = await fetch(path);
    let code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const module = await createShader('shaders/thing.wgsl');

export class Scene {

    static withNThings(nThings) { 
        const things = Array.from({ length: nThings }, () => Thing.random());
        return new Scene(things);
    }

    get canvasSize() {
        return new Float32Array([canvas.width, canvas.height]);
    }

    constructor(things) {

        // vertices (just things for now)
        const segmentCount = 50;
        const [b, v] = sphericalVertexBuffer(device, segmentCount, 0.2);
        this.vertexBuffer = b;
        this.nVertices = v;
        this.things = things;
        const thingData = new Float32Array(this.things.map(thing => thing.data).flat());
        this.thingBuffer = device.createBuffer({
            size: thingData.byteLength,
            mappedAtCreation: true,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        new Float32Array(this.thingBuffer.getMappedRange()).set(thingData);
        this.thingBuffer.unmap();

        // uniform buffer (canvas)
        this.canvasBuffer = device.createBuffer({
            label: 'canvas size',
            size: 2 * 4, // width and height is two floats
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

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
                { binding: 0, resource: { buffer: this.thingBuffer } },
                { binding: 1, resource: { buffer: this.canvasBuffer } }
            ]
        });

        window.addEventListener("resize", this.resize.bind(this));
        window.dispatchEvent(new Event("resize"));

    }

    resize() {
        console.log("resizing canvas");
        
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        this.resizeRequired = true;
    }

    render() {
        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                // clearValue: [0, 1, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        if(this.resizeRequired) {
            console.log("updating uniform");
            device.queue.writeBuffer(this.canvasBuffer, 0, this.canvasSize);
            this.resizeRequired = false;
        }

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.draw(this.nVertices / 3, this.things.length, 0, 0); // draw the cube

        renderPass.end();        
        device.queue.submit([encoder.finish()]);
    }

    animate() {
        this.render();
        requestAnimationFrame(this.animate.bind(this))
    }
}