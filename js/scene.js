import { sphericalVertexBuffer } from "./sphere.js";
import { device, format, ctx, canvas, speedometer } from "./setup.js";
import Camera from "./camera.js";
import { loadTexture } from "./texture.js";
import { cubeVertexBuffer } from "./cube.js";
import { Light } from "./light.js";

async function createShader(path, options) {
    const response = await fetch(path);
    let code = await response.text();
    return device.createShaderModule({ code, label: path });
}

const asteroidModule = await createShader('shaders/thing.wgsl');
const cubeModule = await createShader('shaders/cube.wgsl');
const texture = await loadTexture('textures/asteroid.jpg');
const sampler = device.createSampler();

export default class Scene {

    get canvasSize() {
        return new Float32Array([canvas.width, canvas.height]);
    }

    constructor(radius, asteroids, cubes, segmentCount) {
        this.radius = radius;
        this.camera = new Camera(canvas, this.radius);
        speedometer.max = this.camera.maxSpeed;
        speedometer.low = this.camera.maxSpeed * 0.1;
        speedometer.optimum = this.camera.maxSpeed * 0.3;
        speedometer.high = this.camera.maxSpeed * 0.6;

        // sphere vertices
        let [b, v] = sphericalVertexBuffer(device, segmentCount, 1);
        this.asteroidVertexBuffer = b;
        this.nAsteroidVertices = v;
        
        // asteroid data (model matrices)
        this.asteroids = asteroids;
        const asteroidData = this.asteroidTransforms;
        this.asteroidBuffer = device.createBuffer({
            size: asteroidData.byteLength,
            mappedAtCreation: true,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        new Float32Array(this.asteroidBuffer.getMappedRange()).set(asteroidData);
        this.asteroidBuffer.unmap();

        // cube vertices
        [b, v] = cubeVertexBuffer(device);
        this.cubeVertexBuffer = b;
        this.nCubeVertices = v;

        // cube data
        this.cubes = cubes;
        const cubeData = this.cubeTransforms;
        this.cubeBuffer = device.createBuffer({
            size: cubeData.byteLength,
            mappedAtCreation: true,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        new Float32Array(this.cubeBuffer.getMappedRange()).set(cubeData);
        this.cubeBuffer.unmap();


        // uniform buffers
        this.cameraBuffer = device.createBuffer({
            label: 'camera uniform buffer',
            size: 2 * 16 * 4 + 16, // the view and projection matrices (2 * 16 floats) * 4 bytes per float
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.light = new Light();

        // pipeline
        this.asteroidPipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: asteroidModule,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: 20, // x, y, z, u, v = 5 * 4 bytes (vec3<f32>)
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: "float32x3" }, // x, y, z
                            { shaderLocation: 1, offset: 12, format: "float32x2" }, // u, v
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

        this.cubePipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: cubeModule,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: 24, // x, y, z, x, y, z = 6 * 4 bytes (vec3<f32>)
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: "float32x3" }, // x, y, z
                            { shaderLocation: 1, offset: 12, format: "float32x3" }, // x, y, z
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



        

        // bind buffers to shader
        this.asteroidBindGroup = device.createBindGroup({
            layout: this.asteroidPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.asteroidBuffer } },
                { binding: 1, resource: { buffer: this.cameraBuffer } },
                { binding: 2, resource: sampler },
                { binding: 3, resource: texture, }
            ]
        });

        this.cubeBindGroup = device.createBindGroup({
            layout: this.cubePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.cubeBuffer } },
                { binding: 1, resource: { buffer: this.cameraBuffer } },
                { binding: 2, resource: { buffer: this.light.buffer(device) } },
            ]
        });


        // handle canvas resizing
        window.addEventListener("resize", this.resize.bind(this));
        window.dispatchEvent(new Event("resize"));


        // handling user interaction
        this.keys = {};
        this.controlMap = {
            "w": { thrust: 1 },
            "s": { brake: 1 },
            "a": { roll: -1 },
            "d": { roll: 1 },
        };
        this.mouseDelta = { x: 0, y: 0 };

        canvas.addEventListener("click", () => {
            if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        });

        window.addEventListener("mousemove", ev => {
            if (document.pointerLockElement === canvas) {
                this.mouseDelta.x += ev.movementX;
                this.mouseDelta.y += ev.movementY;
            }
        });

        window.addEventListener("keydown", ev => {
            if (this.controlMap[ev.key]) {
                ev.preventDefault();
            }
            this.keys[ev.key] = true;
        });
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
    }

    get asteroidTransforms() {
        return new Float32Array(this.asteroids.map(asteroids => asteroids.matrix).flat());
    }

    get cubeTransforms() {
        return new Float32Array(this.cubes.map(cube => cube.matrix).flat());
    }


    render() {
        

// console.log("Cubes:", this.nCubeVertices, this.cubes.length);
// console.log("Asteroids:", this.nAsteroidVertices, this.asteroids.length);

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

        renderPass.setPipeline(this.cubePipeline);
        renderPass.setBindGroup(0, this.cubeBindGroup);
        renderPass.setVertexBuffer(0, this.cubeVertexBuffer);
        renderPass.draw(this.nCubeVertices, this.cubes.length, 0, 0); // draw the cubes


        renderPass.setPipeline(this.asteroidPipeline);
        renderPass.setBindGroup(0, this.asteroidBindGroup);
        renderPass.setVertexBuffer(0, this.asteroidVertexBuffer);
        renderPass.draw(this.nAsteroidVertices, this.asteroids.length, 0, 0); // draw the asteroids


        renderPass.end();        
        device.queue.submit([encoder.finish()]);
    }

    update(elapsed) {
        const thrust = (this.keys.w ? 1 : 0);// + (this.keys.s ? -1 : 0);
        const brake = this.keys.s ? 1 : 0;
        const roll = (this.keys.d ? 1 : 0) + (this.keys.a ? -1 : 0);

        if (this.mouseDelta.x || this.mouseDelta.y) {
            this.camera.addMouseLook(this.mouseDelta.x, this.mouseDelta.y);
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }

        if (roll) {
            this.camera.addRoll(roll, elapsed);
        }

        if (thrust) {
            this.camera.applyThrust(thrust, elapsed);
        }

        if (brake) {
            this.camera.applyBrake(brake, elapsed);
        }

        this.camera.update(elapsed);

        this.asteroids.forEach(asteroid => {
            asteroid.update(elapsed);
            if(asteroid.distanceFrom(this.camera.location) > this.radius) {
                asteroid.wrapAround(this.camera.location, this.radius);
            }
        });
        speedometer.value = this.camera.speed;

        device.queue.writeBuffer(this.asteroidBuffer, 0, this.asteroidTransforms);
        device.queue.writeBuffer(this.cameraBuffer, 0, this.camera.data);
    }

    animate(ts) {
        const elapsed = ts - this.prev || 0;
        this.prev = ts;
        this.update(elapsed / 1000);
        this.render();
        requestAnimationFrame(this.animate.bind(this))
    }
}