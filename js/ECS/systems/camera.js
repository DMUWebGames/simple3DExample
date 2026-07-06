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
   
    update(world, deltaTime, activeEntities) {
        const cameraId = world.getResource("activeCameraEntity");

        const uniformData = this.dataForCamera(world, cameraId);

        // create buffer as necessary
        if (!this.cameraBuffers.has(cameraId)) {
            this.cameraBuffers.set(cameraId, device.createBuffer({
                label: `camera uniform buffer ${cameraId}`,
                size: CAMERA_BUFFER_SIZE,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            }));
        }
        const cameraBuffer = this.cameraBuffers.get(cameraId);

        // write the data into the buffer
        device.queue.writeBuffer(cameraBuffer, 0, uniformData);

        // register the camera buffer for use in the render pass
        world.registerResource("activeCameraBuffer", this.cameraBuffers.get(cameraId));
    }

    dataForCamera(world, cameraId) {

        // Check the data for the camera buffer
        if (!world.pools.Position?.has(cameraId) || !world.pools.Camera.has(cameraId)) {
            return;
        }

        // get the data
        const position = vec3.create(...world.pools.Position.getRaw(cameraId));
        const [aspect, near, far, fov] = world.pools.Camera.getRaw(cameraId);

        // TODO: orientation should be data taken from the orientation pool?
        const orientation = vec3.create(0, 0, -1);

        // calculate the matrices
        const target = vec3.add(position, orientation, vec3.create());
        const up = vec3.create(0, 1, 0);
        const viewMatrix = mat4.lookAt(position, target, up);
        const projectionMatrix = mat4.perspective((fov * Math.PI) / 180, aspect, near, far);

        // Prepare the data for the buffer
        const uniformData = new Float32Array(36);
        uniformData.set(viewMatrix, 0);
        uniformData.set(projectionMatrix, 16);
        uniformData.set([position[0], position[1], position[2], 0], 32);
        return uniformData;
    }

    resize(world, canvas) {
        // TODO: loop over all existing cameras rather than just the live one?
        const cameraId = world.getResource("activeCameraEntity");
        const cameraData = world.pools.Camera.getRaw(cameraId);
        cameraData[0] = canvas.width / Math.max(canvas.height, 1);
    }

}