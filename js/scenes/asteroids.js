import { Scene } from "../Engine/scene.js";

// randomises a new scene

function asteroidsScene(config) { 
    const data = asteroidsSceneData(config)
    return Scene.create(data)
}

function asteroidsSceneData(nAsteroids=10) { 
    return {
        renderables: {
            asteroids: {
                material: "asteroid.json",
                entities: Array.from({length: nAsteroids}, () => "WAT?")
            }
        }
    }
}

const asteroids = asteroidsScene();
