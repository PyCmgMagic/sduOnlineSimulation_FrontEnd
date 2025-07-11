import { GameObjects, Scene } from "phaser";

export class MobileError extends Scene 
{
    background: GameObjects.Image;
    errorSmg: GameObjects.Text;
    
    constructor() {
        super("MobileError");
    }
    
    create()
    {
        this.background = this.add.image(512, 384, 'mobile-error-background')
        this.errorSmg = this.add.text(512, 384, "此游戏暂无移动版本，为了您的游戏体验，请使用PC访问！", {
            fontSize: '32px',
            align: 'center'
        }).setOrigin(0.5);
        
        // 确保背景图片填充整个屏幕
        const scaleX = this.cameras.main.width / this.background.width;
        const scaleY = this.cameras.main.height / this.background.height;
        const scale = Math.max(scaleX, scaleY); // 使用较大的缩放值确保完全填充
        this.background.setScale(scale);
        
        
    }
}