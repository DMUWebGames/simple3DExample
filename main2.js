import { SpaceScene } from "./js/scenes/space.js";

class SceneManager {
    constructor() {
        this.currentScene = null;
    }

    switchTo(sceneClass) {
        if (this.currentScene) {
            this.currentScene.dispose();
        }
        this.currentScene = new sceneClass();
        window.dispatchEvent(new Event("resize"));

        this.currentScene.animate();
    }
    
    resize(ev) { 
        if (this.currentScene?.resize) {            
            this.currentScene.resize(ev);
        }
    }
    
}

window.game = new SceneManager();
window.addEventListener("resize", game.resize.bind(game));


game.switchTo(SpaceScene);