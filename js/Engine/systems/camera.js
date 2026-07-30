import { mat4, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { System } from "./base.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";

const cameraShader = await createShader('camera.wgsl');

export class CameraSystem extends System {
    constructor() {
        super({ Camera: { aspect: 16 / 9, near: 0.1, far: 1000, fov: 60 } });
        this.pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: cameraShader,
                entryPoint: "main"
            }
        });
    }
   
    update({ buffers }) {
        const cameraBuffer = buffers.get("Camera");
        const renderCameraBuffer = buffers.get("RenderCamera");
        const positionBuffer = buffers.get("Position");
        const orientationBuffer = buffers.get("Orientation");
        const activeCameraBuffer = buffers.get("activeCamera");

        const pipeline = this.pipeline;
        const bindgroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: positionBuffer } },
                { binding: 1, resource: { buffer: orientationBuffer } },
                { binding: 2, resource: { buffer: cameraBuffer } },
                { binding: 3, resource: { buffer: renderCameraBuffer } },
                { binding: 4, resource: { buffer: activeCameraBuffer } }
            ]
        });

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({
            label: "camera system"
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindgroup);
        pass.dispatchWorkgroups(1);
        pass.end();

        device.queue.submit([encoder.finish()]);

    }

    resize({world, canvas, misc, commands}) {
        // TODO: loop over all existing cameras rather than just the live one?
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        const aspect = canvas.width / Math.max(canvas.height, 1);
        const entityId = misc.get("activeCameraEntity");
        const cameraData = world.pools.Camera.getRaw(entityId);
        cameraData[0] = aspect;
        commands.push({ component: "Camera", type: "write", entityId, data: cameraData });
    }

}