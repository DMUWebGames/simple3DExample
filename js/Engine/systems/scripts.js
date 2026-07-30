import { System } from "./base.js";

export class ScriptingSystem extends System { 

    constructor(scripts, data) { 
        super({ Scriptable: [0, 0] })
        this.scripts = scripts;
        this.data = data;
    }
    
    update(ctx) {
        const { world, activeEntities } = ctx;
        const query = world.query(['Scriptable']);
        const matchingEntities = query.filter(activeEntities, world.signatures);
        for (const entityId of matchingEntities) {
            // ctx.entityId = entityId;
            const [scriptId, dataId] = world.getComponent(entityId, "Scriptable");
            const script = this.scripts[scriptId];
            const data = this.data[dataId];
            script(entityId, data, ctx);
        }
    }
}