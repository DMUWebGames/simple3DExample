import { Transform } from "./components/transform.js";

class ECS {

    constructor(types) {
        this.types = types.map(t => t.name);
        this.entityCount = 0;
        this.components = new Map();
    }

    createEntity() {
        return this.entityCount++;
    }

    addComponent(entityId, component) {
        const componentOfType = this.components.getOrInsert(component.constructor.name, []);
        componentOfType.push(component)
    }

}

const ecs = new ECS([Transform]);

const cubeIds = Array.from({length: 10}, () => {
    const id = ecs.createEntity();
    const transformComponent = new Transform();
    ecs.addComponent(id, transformComponent);
    return id;
});

console.log(cubeIds);
console.log(ecs);


