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
