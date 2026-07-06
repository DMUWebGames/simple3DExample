import { mat4, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { System } from "./base.js";
import { device } from "../../setup.js";

const CAMERA_BUFFER_SIZE = 2 * 16 * 4 + 16;

export class CameraSystem extends System {
    constructor() {
        super({ Camera: { aspect: 16 / 9, near: 0.1, far: 1000, fov: 60 } });
        this.cameraBuffers = new Map();
        this.cameraData = new Map();
    }

    ensureCameraBuffer(world, entityId) {
        if (!world?.pools?.Camera?.has(entityId)) {
            return null;
        }

        if (!this.cameraBuffers.has(entityId)) {
            this.cameraBuffers.set(entityId, device.createBuffer({
                label: `camera uniform buffer ${entityId}`,
                size: CAMERA_BUFFER_SIZE,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            }));
        }

        return this.cameraBuffers.get(entityId);
    }

    getCameraData(world, entityId) {
        if (!world?.pools?.Camera?.has(entityId)) {
            return null;
        }

        return this.cameraData.get(entityId) ?? null;
    }

    update(world, deltaTime, activeEntities) {
        const cameraId = world.getResource("activeCameraEntity");
        this._updateCamera(world, cameraId);

        // create buffer as necessary
        if (!this.cameraBuffers.has(cameraId)) {
            this.cameraBuffers.set(cameraId, device.createBuffer({
                label: `camera uniform buffer ${cameraId}`,
                size: CAMERA_BUFFER_SIZE,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            }));
        }

        // register the camera buffer for use in the render pass
        world.registerResource("activeCameraBuffer", this.cameraBuffers.get(cameraId));
    }

    resize(world, canvas) {
        // TODO: loop over all existing cameras rather than just the live one?
        const cameraId = world.getResource("activeCameraEntity");
        const cameraData = world.pools.Camera.getRaw(cameraId);
        cameraData[0] = canvas.width / Math.max(canvas.height, 1);
    }

    _updateCamera(world, entityId) {
        // console.log("update camera");
        
        // Make sure we have the data we need
        const positionPool = world.pools.Position;
        const cameraPool = world.pools.Camera;
        if (!cameraPool?.has(entityId) || !positionPool.has(entityId)) {
            return;
        }

        // get the data
        const position = vec3.create(...positionPool.getRaw(entityId));
        const [aspect, near, far, fov] = cameraPool.getRaw(entityId);

        // TODO: orientation should be data taken from the orientation pool?
        const orientation = vec3.create(0, 0, -1);

        const target = vec3.add(position, orientation, vec3.create());
        const up = vec3.create(0, 1, 0);

        const viewMatrix = mat4.lookAt(position, target, up);
        const projectionMatrix = mat4.perspective((fov * Math.PI) / 180, aspect, near, far);

        const uniformData = new Float32Array(36);
        uniformData.set(viewMatrix, 0);
        uniformData.set(projectionMatrix, 16);
        uniformData.set([position[0], position[1], position[2], 0], 32);

        this.cameraData.set(entityId, uniformData);

        const cameraBuffer = this.ensureCameraBuffer(world, entityId);
        if (cameraBuffer) {
            device.queue.writeBuffer(cameraBuffer, 0, uniformData);
        }
    }
}