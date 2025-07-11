import { GameObjects, Scene } from "phaser";
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export class ProductGame extends Scene 
{
    
    background: GameObjects.Image;
    bottle: GameObjects.Image; // 合成的瓶子区域
    player: SpriteWithDynamicBody = this.physics.add.sprite(0, 0, 'player');
    pause_button: GameObjects.Container; // 暂停按钮
    time_use: GameObjects.Text // time use
    time_use_number: number;
    
    constructor() 
    {
        super("ProductGame");
    }
    
    create()
    {
        
    }
}