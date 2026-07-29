import { System } from "./base.js";
import { device } from "../../setup.js";

// const LIGHT_BUFFER_SIZE = 2 * 4 * 4; // 2 vec4's

export class LightingSystem extends System {
    constructor() {
        super({
            Direction: { x: 0.5, y: -1.0, z: 0.3, w: 0 },
            Colour: { r: 1, g: 1, b: 1, a: 0 }
        });
        this.buffers = new Map();
    }

    update({ world, buffers, misc }) { 
        
        const lightId = misc.get("activeLightEntity");
        const uniformData = this.dataForLight(world, lightId);
        const lightBuffer = buffers.getOrInsertUniform({
            label: "phongLight",
            data: uniformData
        });
        
        device.queue.writeBuffer(lightBuffer, 0, uniformData);
    }

    dataForLight(world, id) {
        // Check the data for the light buffer
        if (!world.pools.Direction?.has(id) && !world.pools.Colour?.has(id)) {
            return;
        }

        // get the data (direction, colour)
        const direction = world.pools.Direction.getRaw(id);
        const colour = world.pools.Colour.getRaw(id);

        // write it into a temporary array with normalisation
        const data = new Float32Array(8);
        const len = Math.hypot(...direction);
        data.set([direction[0]/len, direction[1]/len, direction[2]/len, 0, ...colour], 0);
        return data;

    }
}