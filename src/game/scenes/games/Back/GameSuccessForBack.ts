import { CustomerOrder } from "../../Game.ts";
import { CommonFunction } from "../../../../utils/CommonFunction.ts";
import { GameResult } from "./Types.ts";
import GameApiService from "../../../../utils/gameApi";

export class GameSuccessForBack extends Phaser.Scene {

    private currentOrder: CustomerOrder;
    private bg: Phaser.GameObjects.Graphics;
    private gameResult: GameResult;

    constructor() {
        super('GameSuccessForBack');
    }

    init(data: { currentOrder: CustomerOrder, result: GameResult }) {
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

    createBg() {
        const mask = this.add.graphics();
        mask.fillStyle(0x000000, 0.5);
        mask.fillRect(0, 0, 1280, 780);
        mask.setDepth(0);

        this.bg = this.add.graphics();
        this.bg.fillStyle(0xffffff, 1);
        this.bg.fillRect(this.cameras.main.centerX - 400, this.cameras.main.centerY - 300, 800, 600);
        this.bg.setDepth(0);
    }

    createContent() {
        const textStyle = {
            fontFamily: "Arial",
            fontSize: '24px',
            color: '#000000',
            align: 'center',
        }

        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "游戏结束", textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, `分数:  ${this.gameResult.score}`, textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `用时:  ${this.timeTranslate(this.gameResult.time)}`, textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, `功能完成:  ${this.gameResult.functionCompleted}/${this.gameResult.totalFunction}`, textStyle).setOrigin(0.5);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, `Bug修复:  ${this.gameResult.bugFixed}/${this.gameResult.totalBug}`, textStyle).setOrigin(0.5);
    }

    createButton() {
        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY + 200, "button-normal", "button-pressed", '返回主界面', 1, async () => {
            console.log("Player reached the stairs!");

            const task = this.currentOrder.items.find(item => item.item.id === 'backend_dev');
            if (task) {
                task.status = 'completed';
                const finalScore = this.calculateExpressiveness();
                console.log(`任务 ${task.item.name} 已标记为完成，评分: ${finalScore}`);

                // 调用API更新游戏状态
                try {
                    CommonFunction.showToast(this, '正在同步游戏进度...', 1500, 'info');

                    const orderId = parseInt(this.currentOrder.id) || 1;

                    const updateData = {
                        items: JSON.stringify([{
                            item: task.item,
                            status: 'completed',
                            difficulty: task.difficulty || 1,
                            score: finalScore
                        }]),
                        status: 'in_progress',
                        preparationProgress: Math.round((this.gameResult.functionCompleted / this.gameResult.totalFunction) * 100)
                    };

                    await GameApiService.updateGameStatus(orderId, updateData);
                    console.log('✅ 后端游戏状态同步成功');
                    CommonFunction.showToast(this, '进度同步成功！', 1500, 'success');

                } catch (error) {
                    console.warn('⚠️ 后端游戏状态同步失败:', error);
                    CommonFunction.showToast(this, '进度同步失败，但游戏继续', 2000, 'warning');
                }
            }

            this.scene.start('GameEntrance', { order: this.currentOrder });
            this.scene.stop("BackEndGame");
        })
    }

    timeTranslate(time: number): string {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    calculateExpressiveness(): number {
        // 1为刚好完成任务：正好在规定时间完成所有功能与修复所有Bug
        const totalFunction = this.gameResult.totalFunction;
        const functionCompleted = this.gameResult.functionCompleted;
        const totalBug = this.gameResult.totalBug;
        const bugFixed = this.gameResult.bugFixed;
        const maxTime = this.gameResult.time + this.gameResult.time_remaining;
        const timeRemaining = this.gameResult.time_remaining;

        // 功能完成率
        let featureRate = functionCompleted / totalFunction;
        // Bug修复率
        let bugRate = bugFixed / totalBug;
        // 时间表现，超前完成可获得额外分
        let timeRate = timeRemaining / maxTime;
        let timeWeighted = timeRate;
        if (featureRate === 1 && bugRate === 1 && timeRate > 0.2) {
            // 如果提前完成所有功能和Bug，剩余时间越多，表现分越高，最多提升0.2
            timeWeighted = Math.min(timeRate + 0.2, 1);
        }

        // 权重：功能0.4，Bug修复0.4，时间0.2
        let expressiveness = 0.4 * featureRate + 0.4 * bugRate + 0.2 * timeWeighted;
        expressiveness = Math.max(0, Math.min(expressiveness, 1.2));
        return Number(expressiveness.toFixed(2));
    }
}