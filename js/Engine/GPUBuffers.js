import { device } from "../setup.js";

const UNIFORM = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
const STORAGE = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
const VERTEX  = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

export class GPUBufferManager { 
    constructor() { 
        this.buffers = new Map();
        this.bufferInfo = new Map();
    }

    _createBuffer(label, data, usage) {
        if (this.buffers.has(label)) throw new Error(`Buffer '${label}' already exists!`);
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
        this.create({ label, data, usage: UNIFORM });
    }

    createStorage({ label, data, stride }) {
        this.create({ label, data, usage: STORAGE });
        this.bufferInfo.set(label, { stride, length: data.length / stride });
        return this.getStorage(label);
    }

    createVertex({ label, vertices, stride }) {
        
        this.create({ label, data: vertices, usage: VERTEX });
        this.bufferInfo.set(label, { stride, length: vertices.length / stride });
        console.log(label, vertices.length, stride);
        return this.getVertex(label);
    }

    createFromWorld(world) {
        for (const [label, pool] of Object.entries(world.pools)) {
            const data = pool.getBuffer();
            const stride = pool.elementsPerEntity * data.BYTES_PER_ELEMENT;
            this.createStorage({ label, data, stride });
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
            const label = `renderableIndices_${key}`;
            const data = new Uint32Array(indexGroups.get(key));
            const stride = data.BYTES_PER_ELEMENT;
            this.createStorage({ label, data, stride });
        }
    }

    get(label) {
        console.log(label);
        
        return this.buffers.get(label);
    }

    getVertex(label) {
        const buffer = this.buffers.get(label);
        const { stride, length } = this.bufferInfo.get(label);
        return { buffer, stride, length };
    }

    getStorage(label) {
        const buffer = this.buffers.get(label);
        const { stride, length } = this.bufferInfo.get(label);
        return { buffer, stride, length };
    }

    setUniform(label, data) {
        const buffer = this.buffers.get(label);
        device.queue.writeBuffer(buffer, 0, data);
    }

    setStorage(label, entityId, data) {
        const buffer = this.buffers.get(label);
        const { stride } = this.bufferInfo.get(label);
        const offset = entityId * stride;
        device.queue.writeBuffer(buffer, offset, data);
    }
}