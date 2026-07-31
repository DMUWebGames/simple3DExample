import { mat4, vec3 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js";
import { device } from "../../setup.js";
import { createShader } from "../../shader.js";
import { ComputeSystem } from "./compute.js";

const cameraShader = await createShader('camera.wgsl');

export class CameraSystem extends ComputeSystem {
    constructor(ctx) { 
        super({
            label: "camera system",
            module: cameraShader,
            groups: [["Position", "Orientation", "Camera", "RenderCamera", "activeCamera", "canvas"]]
        }, ctx);
    }
}
