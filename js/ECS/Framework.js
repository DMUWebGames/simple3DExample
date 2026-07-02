/**
 * Entity Framework - A scalable ECS system for WebGPU rendering
 * Designed to work efficiently from 10s to 300k+ entities
 */

// ============================================================================
// COMPONENT REGISTRY
// ============================================================================

class ComponentRegistry {
    constructor() {
        this.registry = new Map();
        this.bitCounter = 0;
    }

    register(name, defaultValue = {}) {
        if (this.registry.has(name)) {
            throw new Error(`Component ${name} already registered`);
        }
        const bit = 1 << this.bitCounter++;
        this.registry.set(name, { name, bit, defaultValue });
        return bit;
    }

    get(name) {
        return this.registry.get(name);
    }

    getByName(name) {
        const entry = this.registry.get(name);
        return entry ? entry.bit : null;
    }

    all() {
        return Array.from(this.registry.values());
    }
}

// ============================================================================
// TYPED ARRAY COMPONENT STORE
// ============================================================================

class TypedComponentPool {
    constructor(maxEntities, componentDefinition) {
        
        this.maxEntities = maxEntities;
        this.name = componentDefinition.name;
        this.defaultValue = componentDefinition.defaultValue;
       
        // Determine element count based on data layout
        this.elementsPerEntity = this._calculateElementCount(componentDefinition.defaultValue);
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
            const values = Object.values(data);
            this.data.set(values, offset);
        }
        this.active[entityId] = 1;
    }

    get(entityId) {
        if (!this.active[entityId]) return null;
        const offset = entityId * this.elementsPerEntity;
        return this.data.slice(offset, offset + this.elementsPerEntity);
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

// ============================================================================
// ENTITY MANAGER
// ============================================================================

class EntityManager {
    constructor(maxEntities = 10000) {
        this.maxEntities = maxEntities;
        this.nextId = 0;
        this.active = new Set();
        this.deadIds = []; // For reuse
    }

    create() {
        let id;
        if (this.deadIds.length > 0) {
            id = this.deadIds.pop();
        } else {
            id = this.nextId++;
            if (id >= this.maxEntities) {
                throw new Error(`Entity limit (${this.maxEntities}) exceeded`);
            }
        }
        this.active.add(id);
        return id;
    }

    destroy(id) {
        if (!this.active.has(id)) return;
        this.active.delete(id);
        this.deadIds.push(id);
    }

    isActive(id) {
        return this.active.has(id);
    }

    getActive() {
        return Array.from(this.active);
    }

    count() {
        return this.active.size;
    }
}

// ============================================================================
// SIGNATURE MANAGER (Bitwise Component Tracking)
// ============================================================================

class SignatureManager {
    constructor(maxEntities = 10000) {
        this.signatures = new Uint32Array(maxEntities);
    }

    setBit(entityId, componentBit) {
        this.signatures[entityId] |= componentBit;
    }

    clearBit(entityId, componentBit) {
        this.signatures[entityId] &= ~componentBit; // FIXED: was incorrectly using |
    }

    matches(entityId, systemRequiredMask) {
        return (this.signatures[entityId] & systemRequiredMask) === systemRequiredMask;
    }

    getSignature(entityId) {
        return this.signatures[entityId];
    }

    clearSignature(entityId) {
        this.signatures[entityId] = 0;
    }
}

// ============================================================================
// QUERY SYSTEM
// ============================================================================

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


// ============================================================================
// ENTITY FRAMEWORK (Main API)
// ============================================================================

export class EntityFramework {
    constructor(config = {}) {
        this.maxEntities = config.maxEntities || 10000;
        this.config = config;

        // Core systems
        this.componentRegistry = new ComponentRegistry();
        this.entityManager = new EntityManager(this.maxEntities);
        this.signatures = new SignatureManager(this.maxEntities);
        this.pools = {};
        this.systems = [];

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

    addSystem(system) {
        // Calculate required mask for this system
        let requiredMask = 0;
        for (const componentName of system.componentNames) {
            const bit = this.componentRegistry.getByName(componentName);
            if (bit) requiredMask |= bit;
        }
        system.requiredMask = requiredMask;
        system.framework = this;
        
        this.systems.push(system);
    }

    update(deltaTime) {
        const startTime = performance.now();
        const activeEntities = this.entityManager.getActive();

        for (const system of this.systems) {
            const systemStart = performance.now();
            system.update(this, deltaTime, activeEntities);
            this.stats.systemTimes[system.constructor.name] = performance.now() - systemStart;
        }

        this.stats.frameTime = performance.now() - startTime;
        this.stats.entityCount = activeEntities.length;
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

