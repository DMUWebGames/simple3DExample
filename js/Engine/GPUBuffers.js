import { device } from "../setup.js";

const UNIFORM = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
const STORAGE = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;

export class GPUBufferManager { 
    constructor() { 
        this.buffers = new Map();
    }

    _createBuffer(label, data, usage) {
        const buffer = device.createBuffer({
            label,
            size: data.byteLength,
            usage
        });
        device.queue.writeBuffer(buffer, 0, data);
        return buffer;
    }

    create({label, data, usage}) {
        this.buffers.set(label, this._createBuffer(label, data, usage));
    }

    createUniform({label, data}) {
        this.create({ label, data,
            usage: UNIFORM
        })
    }

    createStorage({label, data}) {
        this.create({ label, data,
            usage: STORAGE
        })
    }


    get(label) {
        return this.buffers.get(label);
    }

    getOrInsert({ label, data, usage }) {
        if (!this.buffers.has(label)) {
            this.create({ label, data, usage });
        }
        return this.buffers.get(label);
    }

    getOrInsertUniform({ label, data }) {
        return this.getOrInsert({
            label, data, 
            usage: UNIFORM
        })
    }

    getOrInsertStorage({ label, data }) {
        return this.getOrInsert({
            label, data, 
            usage: STORAGE
        })
    }

    set(label, index, data) {
        const buffer = this.get(label);
        device.queue.writeBuffer(buffer, index, data);
    }
}