import { createShader } from "../../shader.js";
import { RenderSystem } from "./render.js";

const phongShader = await createShader('phong.wgsl');

export class Renderer extends RenderSystem {
    constructor(ctx) { 
        super({
            label: "test renderer",
            module: phongShader,
            groups: [
                [
                    {
                        "type": "index",
                        "key": (id) => `renderableIndices_${id}`
                    },
                    "transform"
                ],
                [
                    "phongLight",
                    "renderCamera",
                    "activeCamera"
                ]
            ]
        }, ctx)
    }
}
