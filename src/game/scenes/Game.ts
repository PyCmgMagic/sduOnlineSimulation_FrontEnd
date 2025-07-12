import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameObjects } from "phaser";
import { CommonFunction } from "../CommonFunction.ts";

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    
    button1: GameObjects.Container;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;

        /* test for game entrance temp */
        this.button1 = CommonFunction.createButton(this, 850, 700, 'button-normal', 'button-pressed', '开工！', 10, () => {this.startGame()})
    
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
    
    private startGame() {
        this.scene.start('GameEntrance');
    }
}
