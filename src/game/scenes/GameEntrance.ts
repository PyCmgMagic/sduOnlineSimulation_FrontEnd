import {GameObjects, Scene} from "phaser";
import {CommonFunction} from "../../utils/CommonFunction.ts";

export class GameEntrance extends Scene{
    
    button1: GameObjects.Container; // product game
    button2: GameObjects.Container; // vision game
    button3: GameObjects.Container; // front-end game
    button4: GameObjects.Container; // back-end game
    
    constructor() {
        super('GameEntrance');
    }
    
    create() 
    {
        this.button1 = CommonFunction.createButton(this, 850, 100, 'button-normal', 'button-pressed', 'Product Game', 10, () => {this.scene.start('ProductGame')})
        this.button2 = CommonFunction.createButton(this, 850, 300, 'button-normal', 'button-pressed', 'Vision Game', 10, () => {})
        this.button3 = CommonFunction.createButton(this, 850, 500, 'button-normal', 'button-pressed', 'Front-End Game', 10, () => {})
        this.button4 = CommonFunction.createButton(this, 850, 700, 'button-normal', 'button-pressed', 'Back-End Game', 10, () => {})
    }
}