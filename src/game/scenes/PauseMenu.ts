import { Scene } from "phaser";

interface PauseSceneData {
    callerScene: string;
}

export class PauseMenu extends Scene {
    
    private callerScene: string;
    private Key_SPACE: Phaser.Input.Keyboard.Key | undefined ;
    
    constructor() {
        super('PauseMenu');
    }
    
    init(data: PauseSceneData) {
        this.callerScene = data.callerScene;
    }
    
    create() {
        
        this.createBackground();
        
        this.Key_SPACE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }
    
    update () {
        if (this.Key_SPACE?.isDown) {
            this.resumeGame();
        }
    }
    
    createBackground() 
    {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(0, 0, 1280, 720);
        
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '⏸️ 已暂停', {
            fontSize: '48px', color: '#8B4513', backgroundColor: 'rgba(255, 248, 220, 0.8)', padding: { x: 20, y: 10 },
            fontFamily: '"Comic Sans MS", cursive'
        }).setOrigin(0.5);
        
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 80, 'Press Space To Continue', {
            fontSize: '32px', color: '#FFFFFF', padding: { x: 20, y: 10 },
            fontFamily: '"Comic Sans MS", cursive'
        }).setOrigin(0.5);
    }
    
    resumeGame(){
        // resume the game
        this.scene.resume(this.callerScene);

        // tell the caller scene that it has been resumed
        const callerScene = this.scene.get(this.callerScene);
        callerScene.events.emit('resume-game');

        // stop the current scene
        this.scene.stop();
    }
}
    