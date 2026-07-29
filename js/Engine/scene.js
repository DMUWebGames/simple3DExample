import { loadMaterial } from "../material.js";

export class Scene {

    static async create({cameras, materials, properties}) {
        materials = await Promise.all(materials.map(loadMaterial));
        return new Scene({
            materials,
            properties,
            cameras
        })
    }

    constructor(label) { 
        this.label = label;
    }

}