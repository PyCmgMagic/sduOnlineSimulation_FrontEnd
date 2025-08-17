import {Scene} from "phaser";
import {CustomerOrder} from "../../Game.ts";
import {CommonFunction} from "../../../../utils/CommonFunction.ts";

export class GameSuccessForProduct extends Scene {
    
    private currentOrder: CustomerOrder;
    private score: number;
    private usedTime: string;
    
    constructor() {
        super({
            key: 'GameSuccessForProduct',
        });
    }
    
    init(data: {currentOrder: CustomerOrder, score: number, time: string})
    {
        this.currentOrder = data.currentOrder;
        this.score = data.score;
        this.usedTime = data.time;
    }
    
    preload()
    {
        
    }
    
    create()
    {
        this.createBackground();
        this.createText();
        this.createButton();
        
        // CommonFunction.createConfirmPopup(this, 512, 368,1024, 500, '您的产品设计已完成！', '成功啊', () => {
        //     console.log('产品开发完成，返回开发中心!');
        //
        //     const task = this.currentOrder.items.find(item => item.item.id === 'product_design');
        //     if (task) {
        //         task.status = 'completed';
        //         console.log(`任务 ${task.item.name} 已标记为完成`);
        //     }
        //
        //     this.scene.start('GameEntrance', {order: this.currentOrder});
        // })
    }
    
    createBackground()
    {
        const graphics = this.add.graphics();
        // 遮罩
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillRect(0, 0, 1280, 720);
        
        // 信息主体的背景
        const width: number = 600;
        const height: number = 400;
        const x: number = this.cameras.main.centerX - width / 2;
        const y: number = this.cameras.main.centerY - height / 2;
        graphics.fillStyle(0xfef1bb, 1);
        graphics.lineStyle(2, 0xeed999, 1)
        graphics.fillRoundedRect(x, y, width, height, 20);
    }
    
    createText() 
    {
        const title: Phaser.GameObjects.Text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, '恭喜您，产品设计完成！', {
            fontSize: '32px',
            color: '#d1aa5c',
            fontFamily: 'Arial',
        });
        title.setOrigin(0.5);
        
        const score: Phaser.GameObjects.Text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `您的设计得分：${this.score}`, {
            fontSize: '24px',
            color: '#d1aa5c',
            fontFamily: 'Arial',
        });
        score.setOrigin(0.5);
        
        const time: Phaser.GameObjects.Text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, `您的设计时间：${this.usedTime}`, {
            fontSize: '24px',
            color: '#d1aa5c',
            fontFamily: 'Arial',
        });
        time.setOrigin(0.5);
    }
    
    createButton()
    {
        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY + 110, "button-normal", "button-pressed", "确定", 10, () => {
            this.scene.stop('ProductGame');
            console.log('产品开发完成，返回开发中心!');
            const task = this.currentOrder.items.find(item => item.item.id === 'product_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }
            this.scene.start('GameEntrance', {order: this.currentOrder});
        })
    }
}
