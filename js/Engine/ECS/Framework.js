import { SignatureManager } from "./SignatureManager.js";
import { TypedComponentPool } from "./TypedComponentPool.js";
import { ComponentRegistry } from "./ComponentRegistry.js";
import { EntityManager } from "./EntityManager.js";

class Query {
    constructor(requiredMask, excludeMask = 0) {
        this.requiredMask = requiredMask;
        this.excludeMask = excludeMask;
    }

    filter(entityIds, signatures) {
        return entityIds.filter(id => {
            const sig = signatures.getSignature(id);
            return (sig & this.requiredMask) === this.requiredMask &&
                   (sig & this.excludeMask) === 0;
        });
    }
}

export class EntityFramework {
    constructor(config = {}) {
        this.maxEntities = config.maxEntities || 10000;
        this.config = config;

        // Core systems
        this.componentRegistry = new ComponentRegistry();
        this.entityManager = new EntityManager(this.maxEntities);
        this.signatures = new SignatureManager(this.maxEntities);
        this.pools = {};

        // Register components from config
        if (config.components) {
            for (const [name, def] of Object.entries(config.components)) {
                this.registerComponent(name, def);
            }
        }

        // Performance tracking
        this.stats = {
            frameTime: 0,
            systemTimes: {},
            entityCount: 0
        };
    }

    registerComponent(name, defaultValue = {}) {
        const bit = this.componentRegistry.register(name, defaultValue);
        this.pools[name] = new TypedComponentPool(this.maxEntities, 
            this.componentRegistry.get(name));
        return bit;
    }

    createEntity() {
        return this.entityManager.create();
    }

    destroyEntity(entityId) {
        // Remove all components
        for (const pool of Object.values(this.pools)) {
            pool.delete(entityId);
        }
        this.signatures.clearSignature(entityId);
        this.entityManager.destroy(entityId);
    }

    addComponent(entityId, componentName, data) {
        if (!this.pools[componentName]) {
            throw new Error(`Component ${componentName} not registered`);
        }
        this.pools[componentName].set(entityId, data);
        const bit = this.componentRegistry.getByName(componentName);
        this.signatures.setBit(entityId, bit);
    }

    updateComponent(entityId, componentName, data) {
        this.pools[componentName]?.set(entityId, data);        
    }

    removeComponent(entityId, componentName) {
        if (!this.pools[componentName]) return;
        this.pools[componentName].delete(entityId);
        const bit = this.componentRegistry.getByName(componentName);
        this.signatures.clearBit(entityId, bit);
    }

    hasComponent(entityId, componentName) {
        return this.pools[componentName]?.has(entityId) || false;
    }

    getComponent(entityId, componentName) {
        return this.pools[componentName]?.get(entityId);
    }

    getComponentBuffer(componentName) {
        return this.pools[componentName]?.getBuffer();
    }

    getActive() { 
        return this.entityManager.getActive();
    }

    query(componentNames) {
        let mask = 0;
        for (const name of componentNames) {
            const bit = this.componentRegistry.getByName(name);
            if (bit) mask |= bit;
        }
        return new Query(mask);
    }

    getStats() {
        return { ...this.stats };
    }

    getEntityCount() {
        return this.entityManager.count();
    }

    // ========================================================================
    // GPU INTEGRATION HELPERS
    // ========================================================================

    /**
     * Export all component data as contiguous buffers suitable for GPU
     * Returns: { componentName: TypedArray }
     */
    exportComponentBuffers() {
        const buffers = {};
        for (const [name, pool] of Object.entries(this.pools)) {
            buffers[name] = pool.getBuffer();
        }
        return buffers;
    }

    /**
     * Get component data for specific entities only
     * Useful for updating GPU buffers with only active/visible entities
     */
    exportComponentData(componentName, entityIds) {
        const pool = this.pools[componentName];
        if (!pool) return null;

        const elemCount = pool.elementsPerEntity;
        const result = new Float32Array(entityIds.length * elemCount);

        for (let i = 0; i < entityIds.length; i++) {
            const entityId = entityIds[i];
            const src = pool.getRaw(entityId);
            result.set(src, i * elemCount);
        }
        return result;
    }
}
