export class EntityManager {
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
