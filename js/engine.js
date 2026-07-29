// import { device } from "./js/setup.js";

export class Engine {

    static async create(GPUoptions, alphamode="premultiplied") { 
        try {
            if (!navigator.gpu) {
                throw new Error("WebGPU is not supported by this browser.");
            }
            const adapter = await navigator.gpu.requestAdapter(GPUoptions);
            if (!adapter) {
                throw new Error("Unable to get a GPU adapter.");
            }
            const device = await adapter.requestDevice();
            return new Engine(adapter, device, alphamode);
        } catch (error) {
            console.error("WebGPU initialization failed:", error.message);
            alert("Failed to initialize WebGPU. Please check browser compatibility or try a different device.");
            throw error;
        }

    }

    constructor(adapter, device, alphamode) {
        this.adapter = adapter;
        this.device = device;
        this.scenes = [];
        this.canvas = document.createElement('canvas');
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.ctx = this.canvas.getContext('webgpu');
        this.alphamode = alphamode;
        this.ctx.configure({
            device: this.device,
            format: this.format,
            alphamode: this.alphamode
        });
        document.body.append(canvas);
    }

    addScene(scene) {
        this.scenes.push(scene);
    }

    start() { 
        if (this.running) return;
        this.running = true;
        this.rafHandle = requestAnimationFrame(this.frame);
    }

    frame(ts) { 
        const elapsed = ts - this.previousTs || 1000 / 60;
        this.previousTs = ts;
        this.scenes.at(-1).update(elapsed / 1000);
        this.rafHandle = requestAnimationFrame(this.frame);
    }
}
