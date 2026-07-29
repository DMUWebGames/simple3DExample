import { mat4, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { System } from "./base.js";
import { device } from "../../setup.js";

// const CAMERA_BUFFER_SIZE = 2 * 16 * 4 + 16;
const LOCAL_FORWARD = vec3.create(0, 0, -1);
const LOCAL_UP = vec3.create(0, 1, 0);

export class CameraSystem extends System {
    constructor() {
        super({ Camera: { aspect: 16 / 9, near: 0.1, far: 1000, fov: 60 } });
        this.cameraBuffers = new Map();
        this.cameraData = new Map();
    }
   
    update({world, buffers, misc}) {
        const cameraId = misc.get("activeCameraEntity");
        const uniformData = this.dataForCamera(world, cameraId);

        const cameraBuffer = buffers.getOrInsertUniform({
            label: "camera",
            data: uniformData
        });

        // write the data into the buffer
        device.queue.writeBuffer(cameraBuffer, 0, uniformData);
    }

    dataForCamera(world, cameraId) {

        // View Matrix
        const position = world.getComponent(cameraId, "Position");
        const orientation = world.getComponent(cameraId, "Orientation");
        const forward = vec3.transformQuat(LOCAL_FORWARD, orientation);
        const up = vec3.transformQuat(LOCAL_UP, orientation);
        const target = vec3.add(position, forward);
        const viewMatrix = mat4.lookAt(position, target, up);

        // Projection matrix
        const [aspect, near, far, fov] = world.getComponent(cameraId, "Camera");
        const projectionMatrix = mat4.perspective((fov * Math.PI) / 180, aspect, near, far);

        // Prepare the data for the buffer
        const uniformData = new Float32Array(36);
        uniformData.set(viewMatrix, 0);
        uniformData.set(projectionMatrix, 16);
        uniformData.set([position[0], position[1], position[2], 0], 32);
        return uniformData;
    }

    resize({world, canvas, misc}) {
        // TODO: loop over all existing cameras rather than just the live one?
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        const cameraId = misc.get("activeCameraEntity");
        const cameraData = world.pools.Camera.getRaw(cameraId);
        cameraData[0] = canvas.width / Math.max(canvas.height, 1);
    }

}