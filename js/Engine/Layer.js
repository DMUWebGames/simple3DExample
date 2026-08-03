export class Layer { 
    constructor(systems) { 
        this.systems = [];
        if (Array.isArray(systems)) {
            for (const s of systems) {
                this.addSystem(s);
            }
        } else {
            throw "WAT?";
        }
    }
    addSystem(system) {
        this.systems.push(system);
    }

    update(ctx) { 
        for (const s of this.systems) {
            performance.mark(`${s.constructor.name} start`,);
            s.update(ctx);
            performance.mark(`${s.constructor.name} complete`);
            performance.measure(`${s.constructor.name}`, `${s.constructor.name} start`, `${s.constructor.name} complete`);

        }
    }

    resize(canvas) {
        for (const s of this.systems) {
            if ("resize" in s) {
                s.resize(canvas);
            }
        }
    }
}