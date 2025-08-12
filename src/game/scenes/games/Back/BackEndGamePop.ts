import {CommonFunction} from "../../../../utils/CommonFunction.ts";
import { Info, infoForIntro, infoForOperation} from "./Types.ts";

export class BackEndGamePop extends Phaser.Scene
{
    private bg: Phaser.GameObjects.Graphics;
    private buttonForClose: Phaser.GameObjects.Container;
    private title: Phaser.GameObjects.Text;
    private content: Phaser.GameObjects.Text;
    
    constructor() {
        super('BackEndGamePop');
    }
    
    preload()
    {
        this.load.image("back-end-game-pop-1", "assets/games/back-end/pop-1.png");
        this.load.image("back-end-game-pop-2", "assets/games/back-end/pop-2.png");
        this.load.image("back-end-game-pop-3", "assets/games/back-end/pop-3.png");
    }
    
    init()
    {
        
    }
    
    create()
    {
        this.createBg();
        this.createButtons();
        this.createMain();
        this.renderInfo(infoForIntro);
    }
    
    createBg() 
    {
        this.bg = this.add.graphics();
        this.bg.fillStyle(0x393e46, 0.7);
        this.bg.fillRect(0, 0, 1280, 780);
        this.bg.setDepth(0);
    }
    
    createButtons()
    {
       this.buttonForClose =  CommonFunction.createButton(this, 1200, 60, "button-normal", "button-pressed", "关闭", 4, () => {
            this.resume();
       })
       this.buttonForClose.setDepth(4);
    }
    
    createMain() {
        const pop1_main = this.add.graphics();
        const pop2_main = this.add.graphics();
        const pop3_main = this.add.graphics();
        
        const x = this.cameras.main.centerX - 400;
        const y = this.cameras.main.centerY - 300;
        
        pop1_main.fillStyle(0xa5dee5, 1);
        pop1_main.fillRect(x, y, 800, 600);
        
        pop2_main.fillStyle(0xe0f9b5, 1);
        pop2_main.fillRect(x, y, 800, 600);
        
        pop3_main.fillStyle(0xffcfdf, 1);
        pop3_main.fillRect(x, y, 800, 600);
        
        const pop1_tag = this.add.graphics();
        const pop2_tag = this.add.graphics();
        const pop3_tag = this.add.graphics();
        
        pop1_tag.fillStyle(0xa5dee5, 1);
        pop1_tag.fillRect(x - 60 , y, 60, 60);
        
        pop2_tag.fillStyle(0xe0f9b5, 1);
        pop2_tag.fillRect(x - 60, y + 60, 60, 60);
        
        pop3_tag.fillStyle(0xffcfdf, 1);
        pop3_tag.fillRect(x - 60, y + 120, 60, 60);
        
        pop1_main.setDepth(3);
        pop2_main.setDepth(2);
        pop3_main.setDepth(1);
        
        pop1_tag.setInteractive(new Phaser.Geom.Rectangle(x - 60, y, 60, 60), Phaser.Geom.Rectangle.Contains);
        pop2_tag.setInteractive(new Phaser.Geom.Rectangle(x - 60, y + 60, 60, 60), Phaser.Geom.Rectangle.Contains);
        pop3_tag.setInteractive(new Phaser.Geom.Rectangle(x - 60, y + 120, 60, 60), Phaser.Geom.Rectangle.Contains);
        
        pop1_tag.on('pointerdown', () => {
            pop1_main.setDepth(3);
            pop2_main.setDepth(2);
            pop3_main.setDepth(1);
            this.renderInfo(infoForIntro);
        })
        pop2_tag.on('pointerdown', () => {
            pop2_main.setDepth(3);
            pop1_main.setDepth(2);
            pop3_main.setDepth(1);
            this.renderInfo(infoForOperation);
        })
        pop3_tag.on('pointerdown', () => {
            pop3_main.setDepth(3);
            pop1_main.setDepth(2);
            pop2_main.setDepth(1);
            this.renderInfo({title: '', content: ''});
        })
        
    }
    
    resume()
    {
        this.scene.resume("BackEndGame");
        this.scene.stop()
    }
    
    renderInfo(info: Info)
    {
        if (this.title) this.title.destroy();
        if (this.content) this.content.destroy()
        
        this.title = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 200, info.title, {
            fontSize: '32px',
            color: '#000000',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0.5);
        this.content = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, info.content, {
            fontSize: '24px',
            color: '#000000',
            fontFamily: 'Arial',
            wordWrap: { width: 700, useAdvancedWrap: true }
        }).setOrigin(0.5, 0.5);
        
        this.title.setDepth(4);
        this.content.setDepth(4);
        
    }
    
}