import { Scene } from "phaser";
import { CustomerOrder } from "../../Game.ts";
import { GameResult } from "./Types.ts";
import GameApiService from "../../../../utils/gameApi";
import { CommonFunction } from "../../../../utils/CommonFunction";

/**
 * 前端游戏成功场景类
 * 负责显示游戏结束后的结果页面
 */
export class GameSuccessForFront extends Scene {
    private currentOrder: CustomerOrder;
    private gameResult: GameResult;
    private bg: Phaser.GameObjects.Graphics;
    private titleText: Phaser.GameObjects.Text;
    private resultContainer: Phaser.GameObjects.Container;
    private backButton: Phaser.GameObjects.Container;
    
    constructor() {
        super('GameSuccessForFront');
    }
    
    /**
     * 初始化场景数据
     * @param data 包含订单和游戏结果的数据对象
     */
    init(data: { order: CustomerOrder, result: GameResult }) {
        this.currentOrder = data.order;
        this.gameResult = data.result;
    }
    
    /**
     * 创建成功场景
     */
    create() {
        this.createBackground();
        this.createTitle();
        this.createResultDisplay();
        this.createBackButton();
    }
    
    /**
     * 创建背景
     */
    private createBackground(): void {
        this.bg = this.add.graphics();
        this.bg.fillStyle(0x2c3e50, 1);
        this.bg.fillRect(0, 0, 1280, 780);
        
        // 添加装饰性背景元素
        const decorBg = this.add.graphics();
        decorBg.fillStyle(0x3498db, 0.1);
        decorBg.fillCircle(200, 150, 100);
        decorBg.fillCircle(1080, 200, 80);
        decorBg.fillCircle(150, 600, 60);
        decorBg.fillCircle(1100, 580, 90);
    }
    
    /**
     * 创建标题
     */
    private createTitle(): void {
        const isWin = this.gameResult.completionRate >= 1;
        const titleText = isWin ? '🎉 游戏胜利！' : '⏰ 时间到！';
        const titleColor = isWin ? '#2ecc71' : '#e74c3c';
        
        this.titleText = this.add.text(640, 120, titleText, {
            fontSize: '48px',
            color: titleColor,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 添加标题阴影效果
        const shadowText = this.add.text(642, 122, titleText, {
            fontSize: '48px',
            color: '#000000',
            fontFamily: 'Arial',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0.3)
        shadowText.setDepth(-1);
    }
    
    /**
     * 创建结果显示
     */
    private createResultDisplay(): void {
        this.resultContainer = this.add.container(640, 400);
        
        // 主结果背景
        const resultBg = this.add.graphics();
        resultBg.fillStyle(0xffffff, 0.95);
        resultBg.fillRoundedRect(-300, -200, 600, 400, 20);
        resultBg.lineStyle(3, 0x3498db, 1);
        resultBg.strokeRoundedRect(-300, -200, 600, 400, 20);
        this.resultContainer.add(resultBg);
        
        let yOffset = -150;
        
        // 分数显示
        const scoreText = this.add.text(0, yOffset, `最终分数: ${this.gameResult.score}`, {
            fontSize: '24px',
            color: '#2c3e50',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.resultContainer.add(scoreText);
        yOffset += 40;
        
        // 完成率显示
        const completionRate = Math.round(this.gameResult.completionRate * 100);
        const completionText = this.add.text(0, yOffset, `目标完成率: ${completionRate}%`, {
            fontSize: '20px',
            color: completionRate >= 100 ? '#27ae60' : '#e67e22',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.resultContainer.add(completionText);
        yOffset += 35;
        
        // 分数评级显示
        const scoreRate = Math.round(this.gameResult.scoreRate * 100);
        const scoreRateText = this.add.text(0, yOffset, `分数评级: ${scoreRate}%`, {
            fontSize: '20px',
            color: scoreRate >= 80 ? '#27ae60' : scoreRate >= 60 ? '#f39c12' : '#e74c3c',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.resultContainer.add(scoreRateText);
        yOffset += 35;
        
        // 游戏时间显示
        const timeText = this.add.text(0, yOffset, `游戏时间: ${this.formatTime(this.gameResult.time)}`, {
            fontSize: '18px',
            color: '#7f8c8d',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.resultContainer.add(timeText);
        yOffset += 40;
        
        // 详细进度显示
        if (this.gameResult.progress && this.gameResult.progress.size > 0) {
            const progressTitle = this.add.text(0, yOffset, '技术学习进度:', {
                fontSize: '18px',
                color: '#2c3e50',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.resultContainer.add(progressTitle);
            yOffset += 30;
            
            // 根据技术栈类型动态设置颜色名称
            const isMobileTechStack = (window as any).useMobileTechStack;
            const colorNames: { [color: number]: string } = isMobileTechStack ? {
                0xFFB366: 'Java',
                0xFFD93D: 'Kotlin',
                0xFF6B9D: 'Dart',
                0x90EE90: 'Flutter',
                0xFF7F7F: '性能优化',
                0x87CEEB: 'Swift',
                0xDDA0DD: '页面美化'
            } : {
                0xFFB366: 'HTML',
                0xFFD93D: 'CSS',
                0xFF6B9D: 'JavaScript',
                0x87CEEB: 'React',
                0x90EE90: 'Vue',
                0xFF7F7F: '性能优化',
                0xDDA0DD: '页面美化'
            };
            
            this.gameResult.progress.forEach((progress, color) => {
                const colorName = colorNames[color] || `技术${color}`;
                const progressPercent = Math.round((progress.current / progress.target) * 100);
                const progressText = this.add.text(0, yOffset, 
                    `${colorName}: ${progress.current}/${progress.target} (${progressPercent}%)`, {
                    fontSize: '14px',
                    color: progressPercent >= 100 ? '#27ae60' : '#7f8c8d',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                this.resultContainer.add(progressText);
                yOffset += 25;
            });
        }
    }
    
    /**
     * 创建返回按钮
     */
    private createBackButton(): void {
        this.backButton = this.add.container(640, 650);
        
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x3498db, 1);
        buttonBg.fillRoundedRect(-80, -25, 160, 50, 10);
        buttonBg.lineStyle(2, 0x2980b9, 1);
        buttonBg.strokeRoundedRect(-80, -25, 160, 50, 10);
        
        const buttonText = this.add.text(0, 0, '返回主菜单', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.backButton.add([buttonBg, buttonText]);
        this.backButton.setInteractive(new Phaser.Geom.Rectangle(-80, -25, 160, 50), Phaser.Geom.Rectangle.Contains);
        
        // 按钮悬停效果
        this.backButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillRoundedRect(-80, -25, 160, 50, 10);
            buttonBg.lineStyle(2, 0x2980b9, 1);
            buttonBg.strokeRoundedRect(-80, -25, 160, 50, 10);
        });
        
        this.backButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x3498db, 1);
            buttonBg.fillRoundedRect(-80, -25, 160, 50, 10);
            buttonBg.lineStyle(2, 0x2980b9, 1);
            buttonBg.strokeRoundedRect(-80, -25, 160, 50, 10);
        });
        
        this.backButton.on('pointerdown', () => {
            this.returnToMainMenu();
        });
    }
    
    /**
     * 格式化时间显示
     * @param seconds 秒数
     * @returns 格式化的时间字符串
     */
    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 返回主菜单
     */
    private async returnToMainMenu(): Promise<void> {
        // 计算最终评分
        const finalScore = Math.round((this.gameResult.completionRate + this.gameResult.scoreRate) * 50);

        // 根据技术栈类型标记对应任务为完成状态
        const isMobileTechStack = (window as any).useMobileTechStack;
        const taskId = isMobileTechStack ? 'mobile_dev' : 'frontend_dev';
        const task = this.currentOrder.items.find(item => item.item.id === taskId);
        if (task) {
            task.status = 'completed';
            console.log(`任务 ${task.item.name} 已标记为完成，评分: ${finalScore}`);

            // 调用API更新游戏状态
            try {
                CommonFunction.showToast(this, '正在同步游戏进度...', 1500, 'info');

                // 准备更新数据 - 这里我们需要一个订单ID，暂时使用一个默认值
                // 在实际应用中，应该从游戏开始时的API响应中获取订单ID
                const orderId = parseInt(this.currentOrder.id) || 1; // 转换为数字，如果失败则使用1

                const updateData = {
                    items: JSON.stringify([{
                        item: task.item,
                        status: 'completed',
                        difficulty: task.difficulty || 1,
                        score: finalScore
                    }]),
                    status: 'in_progress', // 单个任务完成，但整个订单可能还在进行中
                    preparationProgress: Math.round((this.gameResult.completionRate || 0) * 100)
                };

                await GameApiService.updateGameStatus(orderId, updateData);
                console.log(`✅ ${isMobileTechStack ? '移动端' : '前端'}游戏状态同步成功`);
                CommonFunction.showToast(this, '进度同步成功！', 1500, 'success');

            } catch (error) {
                console.warn(`⚠️ ${isMobileTechStack ? '移动端' : '前端'}游戏状态同步失败:`, error);
                CommonFunction.showToast(this, '进度同步失败，但游戏继续', 2000, 'warning');
            }
        }

        // 返回到游戏入口场景，传递订单数据
        this.scene.start('GameEntrance', { order: this.currentOrder });
    }
}