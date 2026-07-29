import { loadMaterial } from "../material";

export class Scene {

    static async create({cameras, materials, properties}) {
        const materials = await Promise.all(materials.map(loadMaterial));
        return new Scene({
            materials,
            properties

        })
    }

    constructor(label) { 
        this.label = label;
    }

}