import { Scene } from "../Engine/scene";

// randomises a new scene

function asteroidsScene(config) { 
    const data = asteroidsSceneData(config)
    return Scene.create()
}

function asteroidsSceneData(nAsteroids=10) { 
    return {
        renderables: {
            asteroids: {
                material: "asteroid.json",
                entities: Array.from({length: nAsteroids}, )
            }
        }
    }
}

const asteroids = asteroidsScene();

console.log(asteroids);
