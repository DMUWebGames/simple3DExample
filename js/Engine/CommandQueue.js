export class CommandQueue {
    constructor() {
        this.commands = [];
    }

    push({ type, entityId, component, data }) {
        this.commands.push({ type, entityId, component, data });
    }

    *[Symbol.iterator]() { 
        for (const command of this.commands) {
            yield command;
        }
    }

    flush({ world, buffers }) {

        for (const { type, entityId, component, data } of this) {
            if (type === "write") {
                console.log({ entityId, component, data });
                const index = world.getComponentIndex(entityId, component);
                buffers.set(component, index, data);
            }
        }
        this.commands.length = 0;
    }
}

