import { CommandQueue } from "./CommandQueue.js";
import { GPUBufferManager } from "./GPUBuffers.js";
import { Layer } from "./Layer.js";
import { ResourceRegistry } from "./ResourceRegistry.js";

export class Scene {

    constructor() { 
        this.commands = new CommandQueue();
        this.layers = new Map();
        this.buffers = new GPUBufferManager();
        this.renderables = new ResourceRegistry();
        this.input = new ResourceRegistry();
        this.misc = new ResourceRegistry();
    }

    addSystem(system) {
        this.layers.push(new Layer([system]));        
    }
    addLayer(name, systems) {
        this.layers.set(name, new Layer(systems));
    }

    resize() {
        this.layers.forEach(layer => {
            if ("resize" in layer) {                
                layer.resize(this.ctx)
            }
        });
    }

    animate() { 
        requestAnimationFrame(this.frame.bind(this));
    }

    frame(ts) {
        const deltaTime = ts - this.prevTime || 1000 / 60;
        this.prevTime = ts;
        this.update(deltaTime / 1000);
        requestAnimationFrame(this.frame.bind(this));
    }

}