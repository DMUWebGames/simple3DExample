import { System } from "./base.js";
import { sphericalVertexBuffer } from "../../sphere.js";
import { device, format, ctx, canvas } from "../../setup.js";
import { loadTexture } from "../../texture.js";
import { Light } from "../../light.js";

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

    getCameraBuffer(entityId) {
        return entityId != null
            ? this.scene.cameraSystem?.getCameraBuffer(this.scene.framework, entityId)
            : null;
    }

    createBindGroup(cameraBuffer) {
        return device.createBindGroup({
            layout: this.asteroidPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.scene.asteroidBuffer } },
                { binding: 1, resource: { buffer: cameraBuffer } },
                { binding: 2, resource: { buffer: this.scene.light.buffer(device) } },
                { binding: 3, resource: sampler },
                { binding: 4, resource: texture },
            ]
        });
    }

    setCameraEntity(entityId) {
        this.cameraEntity = entityId;
        this.cameraBuffer = this.getCameraBuffer(entityId);
        this.asteroidBindGroup = this.cameraBuffer ? this.createBindGroup(this.cameraBuffer) : null;
    }

    resize(ev) {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        
        // depth texture
        this.depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    update(world, deltaTime, activeEntities) {
    }
}
