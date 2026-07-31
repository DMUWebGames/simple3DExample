import { getLayout } from "./LayoutCalculator.js";

export class TypedComponentPool {
    constructor(maxEntities, componentDefinition) {
        
        this.maxEntities = maxEntities;
        this.name = componentDefinition.name;
        this.defaultValue = componentDefinition.defaultValue;
       
        // Determine element count based on data layout
        // this.elementsPerEntity = this._calculateElementCount(componentDefinition.defaultValue);
        // Must be in groups of four, apparently
        // this.trueElementPerEntity = this._calculateElementCount(componentDefinition.defaultValue);
        // this.elementsPerEntity = this.trueElementPerEntity == 3 ? 4 : this.trueElementPerEntity; //Math.ceil(this.trueElementPerEntity / 4) * 4;

        const layout = getLayout(componentDefinition.defaultValue);
        const strideBytes = Math.ceil(layout.size / layout.align) * layout.align;
        this.elementsPerEntity = strideBytes / 4;

        console.log(this);

        this.data = new Float32Array(maxEntities * this.elementsPerEntity);
        this.active = new Uint8Array(maxEntities); // 0 = inactive, 1 = active
    }

    _calculateElementCount(defaultValue) {
        if (typeof defaultValue === 'number') return 1;
        if (Array.isArray(defaultValue)) return defaultValue.length;
        if (defaultValue && typeof defaultValue === 'object') {
            return Object.values(defaultValue).reduce((sum, val) => 
                sum + (Array.isArray(val) ? val.length : 1), 0);
        }
        return 1;
    }

    set(entityId, data) {

        if (entityId >= this.maxEntities) {
            throw new Error(`Entity ${entityId} exceeds max ${this.maxEntities}`);
        }

        const offset = entityId * this.elementsPerEntity;
        
        if (typeof data === 'number') {
            this.data[offset] = data;
        } else if (Array.isArray(data)) {
            this.data.set(data, offset);
        } else if (data && typeof data === 'object') {
            const values = Object.values(data).flat();
            // console.log(this.name, data);
            // console.log(values);
            // sdlfkjnsdf
            this.data.set(values, offset);
        }
        this.active[entityId] = 1;
    }

    get(entityId) {
        if (!this.active[entityId]) return null;
        const offset = entityId * this.elementsPerEntity;
        return this.data.slice(offset, offset + this.elementsPerEntity);
    }

    getIndex(entityId) {
        return entityId * this.elementsPerEntity;
    }

    getRaw(entityId) {
        return this.data.subarray(
            entityId * this.elementsPerEntity,
            (entityId + 1) * this.elementsPerEntity
        );
    }

    has(entityId) {
        return this.active[entityId] === 1;
    }

    delete(entityId) {
        this.active[entityId] = 0;
    }

    getBuffer() {
        return this.data;
    }

    getActiveIndices() {
        const indices = [];
        for (let i = 0; i < this.maxEntities; i++) {
            if (this.active[i]) indices.push(i);
        }
        return indices;
    }
}