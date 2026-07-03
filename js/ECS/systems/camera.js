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

    getCameraBuffer(world, entityId) {
        return this.ensureCameraBuffer(world, entityId);
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
        const activeCameraBuffer = this.getCameraBuffer(world, cameraId);
        world.registerResource("activeCameraBuffer", activeCameraBuffer);
    }

    resize(world, canvas) {
        const cameraId = world.getResource("activeCameraEntity");
        this.updateAspect(world, cameraId, canvas.width, canvas.height);
    }

    updateAspect(world, entityId, width, height) {
        if (!world?.pools?.Camera?.has(entityId)) {
            return;
        }

        const cameraData = world.pools.Camera.getRaw(entityId);
        cameraData[0] = width / Math.max(height, 1);
        this._updateCamera(world, entityId);
    }

    _updateCamera(world, entityId) {
        // console.log("update camera");
        
        const cameraPool = world.pools.Camera;
        const positionPool = world.pools.Position;

        if (!cameraPool?.has(entityId)) {
            return;
        }

        const cameraData = cameraPool.getRaw(entityId);
        const aspect = cameraData[0] ?? 16 / 9;
        const near = cameraData[1] ?? 0.1;
        const far = cameraData[2] ?? 1000;
        const fov = cameraData[3] ?? 60;

        const position = positionPool?.has(entityId) ? positionPool.getRaw(entityId) : new Float32Array([0, 0, 0]);

        const cameraPosition = vec3.create(position[0] ?? 0, position[1] ?? 0, position[2] ?? 0);
        const target = vec3.add(cameraPosition, vec3.create(0, 0, -1), vec3.create());
        const up = vec3.create(0, 1, 0);

        const viewMatrix = mat4.lookAt(cameraPosition, target, up);
        const projectionMatrix = mat4.perspective((fov * Math.PI) / 180, aspect, near, far);

        const uniformData = new Float32Array(36);
        uniformData.set(viewMatrix, 0);
        uniformData.set(projectionMatrix, 16);
        uniformData.set([cameraPosition[0], cameraPosition[1], cameraPosition[2], 0], 32);

        this.cameraData.set(entityId, uniformData);

        const cameraBuffer = this.ensureCameraBuffer(world, entityId);
        if (cameraBuffer) {
            device.queue.writeBuffer(cameraBuffer, 0, uniformData);
        }
    }
}