import {Scene} from "phaser";
import {CustomerOrder} from "../../Game.ts";
import {CommonFunction} from "../../../../utils/CommonFunction.ts";
import { GameResult, levelScoreTable } from "./Types.ts";

export class GameSuccessForProduct extends Scene {
    
    private currentOrder: CustomerOrder;
    private score: number;
    private usedTime: number;
    private max_level_index: number;
    private target_level: number;
    private time_remaining: number;
    
    constructor() {
        super({
            key: 'GameSuccessForProduct',
        });
    }
    
    init(data: {currentOrder: CustomerOrder, gameResult: GameResult}) {
        this.currentOrder = data.currentOrder;
        this.score = data.gameResult.score;
        this.usedTime = data.gameResult.time_use;
        this.max_level_index = data.gameResult.max_level_index;
        this.target_level = data.gameResult.target_level;
        this.time_remaining = data.gameResult.time_remaining;
    }
    
    preload()
    {
        
    }
    
    create()
    {
        this.createBackground();
        this.createText();
        this.createButton();
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
        const title: Phaser.GameObjects.Text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, '游戏结束', {
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
        
        const time: Phaser.GameObjects.Text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, `您的设计用时：${this.timeFormat(this.usedTime)}`, {
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
                console.log(this.calculateExpressiveness());
                
            }
            this.scene.start('GameEntrance', {order: this.currentOrder});
        })
    }

    calculateExpressiveness() : number {
        let baseScore: number = 0;
        for (let i = 0; i < this.target_level; i++) {
            baseScore += levelScoreTable[i] * Math.pow(2, this.target_level - i);
        }
        const maxTime: number = this.usedTime + this.time_remaining;

        const scorePart: number = this.score / baseScore;
        let scoreWeighted = scorePart >= 1 ? 1 + Math.min((scorePart - 1) * 0.2, 0.1) : scorePart;
        scoreWeighted = Math.min(scoreWeighted, 1.1);

        let levelPart: number = Math.min(1, this.max_level_index / this.target_level);
        let timePart: number = Math.max(0, this.time_remaining / maxTime);

        let expressiveness: number = 0.3 * scoreWeighted + 0.5 * levelPart + 0.4 * timePart;
        expressiveness = Math.max(0, Math.min(1.2, expressiveness));

        return Number(expressiveness.toFixed(2));
    }

    private timeFormat(time: number): string{
        const second = time % 60;
        const minute = (time - second) / 60;
        let result: string;
        if (minute < 10) {
            result = "0" + minute;
        } else {
            result = minute.toString();
        }
        if (second < 10) {
            result += ":0" + second;
        } else {
            result += ":" + second;
        }
        return result;
    }

}
