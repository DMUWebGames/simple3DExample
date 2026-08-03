import { CommandQueue } from "./CommandQueue.js";
import { EntityFramework } from "./ECS/Framework.js";
import { GPUBufferManager } from "./GPUBuffers.js";
import { Layer } from "./Layer.js";
import { ResourceRegistry } from "./ResourceRegistry.js";

// import { canvas } from "../setup.js";

export class Scene {

    constructor(config) { 
        performance.mark('scene start');
        this.world = new EntityFramework(config);
        this.commands = new CommandQueue();
        this.layers = new Map();
        this.buffers = new GPUBufferManager();
        this.renderables = new ResourceRegistry();
        this.input = new ResourceRegistry();
        this.misc = new ResourceRegistry();
        this._createUniformBuffers();
        performance.mark('scene end');
        performance.measure('scene init', 'scene start', 'scene end');
    }

    _createUniformBuffers() { 
        
        this.buffers.createUniform({
            label: "deltaTime",
            data: new Float32Array([0])
        });

        this.buffers.createUniform({
            label: "canvas",
            data: new Float32Array([1])
        });
    }

    addSystem(system) {
        this.layers.push(new Layer([system]));        
    }
    addLayer(name, systems) {
        this.layers.set(name, new Layer(systems));
    }

    resize(canvas) {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        this.buffers.setUniform("canvas", new Float32Array([canvas.width / canvas.height]));
        for (const layer of this.layers.values()) {
            layer.resize(canvas);            
        }
    }

    animate() { 
        requestAnimationFrame(this.frame.bind(this));
    }

    frame(ts) {
        const deltaTime = (ts - this.prevTime || 1000 / 60) / 1000;
        this.prevTime = ts;
        this.buffers.setUniform("deltaTime", new Float32Array([deltaTime]));
        this.update(deltaTime);
        requestAnimationFrame(this.frame.bind(this));
    }

}