
export class ResourceRegistry {
    #names;
    #map;
    constructor() {
        this.#names = [];
        this.#map = new Map();
    }

    set(name, value) {
        if (!this.#names.includes(name)) {
            this.#names.push(name);
        }
        const id = this.#names.indexOf(name);
        this.#map.set(name, value);
        return id;
    }

    get(name) {
        return this.#map.get(name);
    }

    getByIndex(id) {
        return this.get(this.#names[id]);
    }

    indexOf(name) {
        return this.#names.indexOf(name);
    }

    getOrInitialise(name, callback) {
        const resource = this.get(name);
        if(!resource) {
            const newResource = callback();
            this.set(name, newResource);
            return newResource;
        }
        return resource;
    }

    *[Symbol.iterator]() { 
        for (const id in this.#names) {
            const name = this.#names[id];
            const resource = this.#map.get(name);
            yield {id, name, resource}
        }
    }

}
