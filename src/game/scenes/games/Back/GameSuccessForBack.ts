import {CustomerOrder} from "../../Game.ts";
import {CommonFunction} from "../../../../utils/CommonFunction.ts";
import { GameResult } from "./Types.ts";

export class GameSuccessForBack extends Phaser.Scene {
    
    private currentOrder: CustomerOrder;
    private bg: Phaser.GameObjects.Graphics;
    private gameResult: GameResult;
    
    constructor() {
        super('GameSuccessForBack');
    }

    init(data: {currentOrder: CustomerOrder, result: GameResult})
    {
        this.currentOrder = data.currentOrder;
        this.gameResult = data.result;
    }
    
    preload() {
        
    }
    
    create() {
        this.createBg();
        this.createContent();
        this.createButton();
    }
    
    createBg()
    {
        const mask = this.add.graphics();
        mask.fillStyle(0x000000, 0.5);
        mask.fillRect(0, 0, 1280, 780);
        mask.setDepth(0);
        
        this.bg = this.add.graphics();
        this.bg.fillStyle(0xffffff, 1);
        this.bg.fillRect(this.cameras.main.centerX - 400, this.cameras.main.centerY - 300, 800, 600);
        this.bg.setDepth(0);
    }
    
    createContent()
    {
        const textStyle = {
            fontFamily: "Arial",
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }
        
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, '恭喜您，您的后端设计已完成！', textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, `分数:  ${this.gameResult.score}`, textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY , `用时:  ${this.gameResult.time}`, textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, `功能完成:  ${this.gameResult.functionCompleted}/${this.gameResult.totalFunction}`, textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, `Bug修复:  ${this.gameResult.bugFixed}/${this.gameResult.totalBug}`, textStyle).setOrigin(0.5);
    }
    
    createButton()
    {
        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY + 200, "button-normal", "button-pressed",'返回主界面', 1, () => {
            console.log("Player reached the stairs!");
            {
                const task = this.currentOrder.items.find(item => item.item.id === 'backend_dev');
                if (task) {
                    task.status = 'completed';
                    console.log(`任务 ${task.item.name} 已标记为完成`);
                }
                this.scene.start('GameEntrance', { order: this.currentOrder });
                this.scene.stop("BackEndGame");
            }
        })
    }
}