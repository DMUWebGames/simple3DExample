class EntityManager {
    constructor() {
        this.nextEntityId = 0;
        this.activeEntities = new Set();
    }

    createEntity() {
        const id = this.nextEntityId++;
        this.activeEntities.add(id);
        return id;
    }

    destroyEntity(id) {
        this.activeEntities.delete(id);
        // delete components
    }
}


class ComponentRegistry {
    constructor() {
        this.nextComponentBit = 0;
        this.data = new Map();
    }

    get(name) {
        if(!this.data.has(name)) {
            this.data.set(name, 1 << this.nextComponentBit++);
        }
        return this.data.get(name);
    }
}

class ComponentPool {
    constructor() {
        this.data = []; // typed array optional
    }

    set(entityId, componentData) {
        this.data[entityId] = componentData;
    }

    get(entityId) {
        return this.data[entityId];
    }

    has(entityId) {
        return !!this.get(entityId);
    }    

    delete(entityId) {
        delete this.data[entityId];
    }
}

class SignatureManager {
    constructor() {
        this.signatures = []
    }

    setBit(entityId, componentBit) {
        this.signatures[entityId] = (this.signatures[entityId] || 0) | componentBit;
    }

    clearBit(entityId, componentBit) {
        this.signatures[entityId] = (this.signatures[entityId] || 0) & ~componentBit;
    }

    matches(entityId, mask) {
        const entityMask = this.signatures[entityId] || 0;
        return (entityMask & mask) == mask;
    }

    filter(entities, mask) {
        return [...entities].filter(id => this.matches(id, mask));
    }
}

class MovementSystem {
    constructor(registry) {
        // registerComponent("Position", "Velocity");
        this.requiredMask = registry.get("Position") | registry.get("Velocity");
    }

    update(entities, signatures, positionPool, velocityPool) {
        for(const entityId of entities) {
            if(signatures.matches(entityId, this.requiredMask)) {
                const pos = positionPool.get(entityId);
                const vel = velocityPool.get(entityId);
                pos.x += vel.x;
                pos.y += vel.y;
            }
        }

    }
}

class ECSWorld {
    constructor() {
        this.entities = new EntityManager();
        this.signatures = new SignatureManager();
        this.componentRegistry = new ComponentRegistry();
        this.pools = {
            Position: new ComponentPool(),
            Velocity: new ComponentPool()
        }
    }

    addComponent(entityId, componentName, data) {
        this.pools[componentName].set(entityId, data);
        this.signatures.setBit(entityId, this.componentRegistry.get(componentName));
    }

    removeComponent(entityId, componentName) {
        this.pools[componentName].delete(entityId);
        this.signatures.clearBit(entityId, this.componentRegistry.get(componentName));
    }
}

const w = new ECSWorld();
const m = new MovementSystem(w.componentRegistry);

while(w.entities.nextEntityId < 100) {

    const entityId = w.entities.createEntity();
    w.addComponent(entityId, "Position", {x: Math.random(), y: Math.random()});
    w.addComponent(entityId, "Velocity", {x: Math.random() - 0.5, y: Math.random() - 0.5});

}
console.log(w);
