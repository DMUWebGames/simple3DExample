import { loadComponent } from "../components.js";
import { loadModel } from "../model.js";
import { loadSystem } from "../system.js";
import { CommandQueue } from "./CommandQueue.js";
import { EntityFramework } from "./ECS/Framework.js";
import { GPUBufferManager } from "./GPUBuffers.js";
import { Layer } from "./Layer.js";
import { ResourceRegistry } from "./ResourceRegistry.js";
import { ScriptManager } from "./ScriptManager.js";
import { ComputeSystem } from "./systems/compute.js";


export class Scene {

    static async create(device, canvas, config) {
        performance.mark('scene-create-0');
        config.components = Object.fromEntries(await Promise.all(config.components.map(async (c) => [c, await loadComponent(c)])));
        config.models = Object.fromEntries(await Promise.all(config.models.map(async (m) => [m, await loadModel(m)])));
        for (const layer of config.layers) {
            layer.systems = await Promise.all(layer.systems.map(loadSystem));
        }
        performance.mark('scene-create-1');
        performance.measure("shaders loaded", "scene-create-0", "scene-create-1");
        return new this(device, canvas, config);
    }

    constructor(device, canvas, config) { 
        performance.mark('scene start');
        this.device = device;
        this.canvas = canvas;
        this.models = config.models;
        this.world = new EntityFramework(config);
        this.commands = new CommandQueue();
        this.layers = new Map();
        this.buffers = new GPUBufferManager();
        this.renderables = new ResourceRegistry();
        this.input = new ResourceRegistry();
        this.misc = new ResourceRegistry();
        this.scripts = new ScriptManager();
        this.__createUniformBuffers();
        this.initMouse();
        this.initKeys();
        performance.mark('scene end');
        performance.measure('scene init', 'scene start', 'scene end');
    }

    __createUniformBuffers() { 
        
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

    addLayers(layers) {
        for (const layer of layers) {
            const systems = layer.systems.map((layer) => { 
                return new ComputeSystem(layer, {
                    buffers: this.buffers,
                    device: this.device
                });
            })
            this.addLayer(layer.label, systems);
        }
    }

    addRenderable(label, vertices, material, { stride }) { 
        const { buffer, length } = this.buffers.createVertex({
            label: `${label} vertices (stride: ${stride})`,
            vertices, stride
        });
        return this.renderables.set(label, {
            vertexBuffer: buffer,
            vertexCount: length,
            material
        });        
    }

    resize(canvas) {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        this.buffers.setUniform("canvas", new Float32Array([canvas.width / canvas.height]));
        for (const layer of this.layers.values()) {
            layer.resize(canvas);            
        }
    }

    initMouse() { 
        this.input.set("mouse", { movementX: 0, movementY: 0 });
        const mouse = this.input.get("mouse");
        function updateMouse(ev) { 
            mouse.movementX = ev.movementX;
            mouse.movementY = ev.movementY;
        }
        this.canvas.addEventListener("click", () => {
            if (document.pointerLockElement !== this.canvas && this.canvas.requestPointerLock) {
                this.canvas.requestPointerLock();
            }
        });
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === this.canvas) {
                this.canvas.addEventListener("mousemove", updateMouse);
            } else {
                this.canvas.removeEventListener("mousemove", updateMouse);
            }
        });
    }

    initKeys() { 
        const keyMap = "wasd";
        this.input.set("keys", Object.fromEntries(Array.from(keyMap).map(k => [k, false])));
        const keys = this.input.get("keys");
        globalThis.addEventListener("keydown", ev => {
            keys[ev.key] = true;
        });
        globalThis.addEventListener("keyup", ev => {
            keys[ev.key] = false;
        });
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