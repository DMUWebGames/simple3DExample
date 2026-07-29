export class ComponentRegistry {
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
