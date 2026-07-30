import { device } from "../setup.js";

const UNIFORM = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
const STORAGE = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;

export class GPUBufferManager { 
    constructor() { 
        this.buffers = new Map();
    }

    _createBuffer(label, data, usage) {
        if (this.buffers.has(label)) throw `Buffer '${label}' already exists!`;
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


    createFromWorld(world) {
        const buffers = world.exportComponentBuffers();
        for (const [label, data] of Object.entries(buffers)) {
            this.createStorage({ label, data });
        }
    }

    indexBy(world, component, dataIndex) {

        // Get the full list of entities with the requested component
        const activeEntities = world.getActive();
        const indexableEntities = world.query([component]).filter(activeEntities, world.signatures);

        // Group the given component on the given value (at dataIndex)
        const indexGroups = Map.groupBy(indexableEntities, (entityId) => {
            return world.getComponent(entityId, component)[dataIndex];
        });
       
        // Create indexBuffers for each group
        for (const key of indexGroups.keys()) {
            this.createStorage({
                label: `renderableIndices_${key}`,
                data: new Uint32Array(indexGroups.get(key))
            })
        }
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
        device.queue.writeBuffer(buffer, index, data, 0, data.byteLength/4);
    }
}