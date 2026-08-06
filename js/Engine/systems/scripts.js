export class ScriptingSystem { 

    constructor(scripts, data) { 
        this.scripts = scripts;
        this.data = data;
    }
    
    update(ctx) {
        const { world, activeEntities } = ctx;
        const query = world.query(['scriptable']);
        const matchingEntities = query.filter(activeEntities, world.signatures);
        
        for (const entityId of matchingEntities) {
            const [scriptId, dataId] = world.getComponent(entityId, "scriptable");
            const script = this.scripts[scriptId];
            const data = this.data[dataId];
            script(entityId, data, ctx);
        }
    }
}