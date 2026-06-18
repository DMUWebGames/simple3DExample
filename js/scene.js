import { sphericalVertexBuffer } from "./sphere.js";
import { device, format, ctx, canvas } from "./setup.js";
import Thing from "./thing.js";
import Camera from "./camera.js";

async function createShader(path, options) {
    const response = await fetch(path);
    let code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const module = await createShader('shaders/thing.wgsl');

export default class Scene {

    get canvasSize() {
        return new Float32Array([canvas.width, canvas.height]);
    }

    constructor(radius, things) {
        this.radius = radius;
        this.camera = new Camera(canvas, this.radius);

        // sphere vertices
        const segmentCount = 10;
        const [b, v] = sphericalVertexBuffer(device, segmentCount, 1);
        this.vertexBuffer = b;
        this.nVertices = v;

        // thing data (model matrices)
        this.things = things;
        this.nThings = things.length;
        const thingData = this.thingData;
        this.thingBuffer = device.createBuffer({
            size: thingData.byteLength,
            mappedAtCreation: true,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        new Float32Array(this.thingBuffer.getMappedRange()).set(thingData);
        this.thingBuffer.unmap();

        // uniform buffer (camera)
        this.cameraBuffer = device.createBuffer({
            label: 'camera uniform buffer',
            size: 2 * 16 * 4, // the view and projection matrices (2 * 16 floats) * 4 bytes per float
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
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less",
                stencil: {},
                bias: {},
            },
        });

        // bind buffers to shader
        this.renderBindGroup = device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.thingBuffer } },
                { binding: 1, resource: { buffer: this.cameraBuffer } }
            ]
        });

        // handle canvas resizing
        window.addEventListener("resize", this.resize.bind(this));
        window.dispatchEvent(new Event("resize"));


        // handling user interaction
        // The WASD keys rotate around the origin
        this.keys = {};
        this.keyMap = {
            "w": [0, 0, -1],
            "a": [-1, 0, 0],
            "s": [0, 0, 1],
            "d": [1, 0, 0],
        };

        window.addEventListener("keydown", ev => { this.keys[ev.key] = true;});
        window.addEventListener("keyup", ev => {delete this.keys[ev.key];});


    }

    resize() {
        console.log("resizing canvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        this.camera.resize(canvas);

        // depth texture
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });        


        this.resizeRequired = true;
    }

    get thingData() {
        return new Float32Array(this.things.map(thing => thing.matrix).flat());
    }

    render() {
        device.queue.writeBuffer(this.thingBuffer, 0, this.thingData);

        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                // clearValue: [0, 1, 0, 1],
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

        if(this.resizeRequired) {
            console.log("updating uniform");
            device.queue.writeBuffer(this.cameraBuffer, 0, this.camera.data);
            this.resizeRequired = false;
        }

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.draw(this.nVertices / 3, this.things.length, 0, 0); // draw the cube

        renderPass.end();        
        device.queue.submit([encoder.finish()]);
    }

    update(elapsed) {

        this.things.forEach(thing => {
            thing.update(elapsed);
            if(thing.distanceFrom(this.camera.location) > this.radius) {
                thing.wrapAround(this.camera.location, this.radius);
            }
        });

    }

    animate(ts) {
        const elapsed = ts - this.prev || 0;
        this.prev = ts;
        this.update(elapsed / 1000);
        this.render();
        requestAnimationFrame(this.animate.bind(this))
    }
}