
export class System {
    constructor(requiredComponents = {}) {
        this.requiredComponents = requiredComponents;
        this.requiredMask = 0;
        this.componentNames = Object.keys(requiredComponents);
    }

    // Override in subclass
    update(world, deltaTime) {
        throw new Error('System.update() must be implemented');
    }

    resize(canvas) {
        throw new Error('System.resize() must be implemented');
    }

    // Helper to get component data
    getComponent(world, entityId, componentName) {
        return world.pools[componentName]?.getRaw(entityId);
    }
}
