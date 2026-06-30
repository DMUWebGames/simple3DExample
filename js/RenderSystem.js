import { System } from "./ECS/Framework.js";
import { sphericalVertexBuffer } from "./sphere.js";
import { device, format, ctx, canvas } from "./setup.js";
import { loadTexture } from "./texture.js";
import { Light } from "./light.js";

async function createShader(path) {
    const response = await fetch(path);
    const code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const asteroidModule = await createShader("shaders/thing.wgsl");
const texture = await loadTexture("textures/asteroid.jpg");
const sampler = device.createSampler();

export class RenderSystem extends System {
    constructor(scene) {
        super({});
        this.scene = scene;

        if (!this.scene.cameraBuffer) {
            this.scene.cameraBuffer = device.createBuffer({
                label: "camera uniform buffer",
                size: 2 * 16 * 4 + 16,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }

        if (!this.scene.light) {
            this.scene.light = new Light();
        }

        const [buffer, vertexCount] = sphericalVertexBuffer(device, this.scene.segmentCount ?? 16, 1);
        this.asteroidVertexBuffer = buffer;
        this.nAsteroidVertices = vertexCount;

        if (!this.scene.asteroidBuffer) {
            this.scene.asteroidBuffer = device.createBuffer({
                size: this.asteroidTransforms.byteLength,
                mappedAtCreation: true,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });
            new Float32Array(this.scene.asteroidBuffer.getMappedRange()).set(this.asteroidTransforms);
            this.scene.asteroidBuffer.unmap();
        }

        this.asteroidPipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: asteroidModule,
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
                module: asteroidModule,
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

        this.asteroidBindGroup = device.createBindGroup({
            layout: this.asteroidPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.scene.asteroidBuffer } },
                { binding: 1, resource: { buffer: this.scene.cameraBuffer } },
                { binding: 2, resource: { buffer: this.scene.light.buffer(device) } },
                { binding: 3, resource: sampler },
                { binding: 4, resource: texture },
            ]
        });
    }

    get asteroidTransforms() {
        return new Float32Array((this.scene.asteroids || []).map(asteroid => asteroid.matrix).flat());
    }

    resize(ev) {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        console.log(this);
        
        this.scene.camera.resize(canvas);

        // depth texture
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    render() {
        
        if (!this.scene?.depthTexture || !this.scene.camera || !this.scene.asteroids?.length) {
            return;
        }
        console.log(this.scene);

        device.queue.writeBuffer(this.scene.asteroidBuffer, 0, this.asteroidTransforms);
        device.queue.writeBuffer(this.scene.cameraBuffer, 0, this.scene.camera.data);

        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: {
                view: this.scene.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            }
        });

        renderPass.setPipeline(this.asteroidPipeline);
        renderPass.setBindGroup(0, this.asteroidBindGroup);
        renderPass.setVertexBuffer(0, this.asteroidVertexBuffer);
        renderPass.draw(this.nAsteroidVertices, this.scene.asteroids.length, 0, 0);

        renderPass.end();
        device.queue.submit([encoder.finish()]);
    }

    update(world, deltaTime) {
        // console.log(this.framework.getStats());
        
        this.render();
    }
}
