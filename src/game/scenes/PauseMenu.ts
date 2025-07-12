import {GameObjects, Scene} from "phaser";
import {CommonFunction} from "../CommonFunction.ts";

interface PauseSceneData {
    callerScene: string;
}

export class PauseMenu extends Scene {
    
    private callerScene: string;
    
    resumeButton: GameObjects.Container;
    
    constructor() {
        super('PauseMenu');
    }
    
    init(data: PauseSceneData) {
        this.callerScene = data.callerScene;
    }
    
    create() {
        this.resumeButton = CommonFunction.createButton(this, 514, 384, 'button-normal', 'button-pressed', "Resume", 10, () => {
            // resume the game
            this.scene.resume(this.callerScene);

            // tell the caller scene that it has been resumed
            const callerScene = this.scene.get(this.callerScene);
            callerScene.events.emit('resume-game');
            
            // stop the current scene
            this.scene.stop();
        })
    }
}
    