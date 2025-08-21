import { Info, infoForIntro, infoForOperation, GameTargets } from "./Types.ts";

/**
 * 前端游戏弹窗场景类
 * 负责显示游戏介绍、操作说明等弹窗内容
 */
export class FrontEndGamePop extends Phaser.Scene {
    private bg: Phaser.GameObjects.Graphics;
    private buttonForClose: Phaser.GameObjects.Container;
    private title: Phaser.GameObjects.Text;
    private content: Phaser.GameObjects.Text;
    private gameTargets: GameTargets;
    private targetText: Phaser.GameObjects.Text;

    
    constructor() {
        super('FrontEndGamePop');
    }
    
    /**
     * 初始化弹窗数据
     * @param data 包含游戏目标的数据对象
     */
    init(data: { gameTargets: GameTargets }) {
        this.gameTargets = data.gameTargets;
    }
    
    /**
     * 创建弹窗场景
     */
    create() {
        this.createBg();
        this.createButtons();
        this.createMain();
        this.renderInfo(infoForIntro);
        this.setupKeyboardControls();
    }
    
    /**
     * 设置键盘控制
     */
    private setupKeyboardControls(): void {
        // 监听E键和ESC键来关闭弹窗
        this.input.keyboard?.on('keydown-E', () => {
            this.resume();
        });
        
        this.input.keyboard?.on('keydown-ESC', () => {
            this.resume();
        });
    }
    
    /**
     * 创建背景
     */
    createBg() {
        this.bg = this.add.graphics();
        this.bg.fillStyle(0x393e46, 0.7);
        this.bg.fillRect(0, 0, 1280, 780);
        this.bg.setDepth(0);
    }
    
    /**
     * 创建按钮
     */
    createButtons() {
        // 关闭按钮
        this.buttonForClose = this.add.container(1200, 100);
        const closeButtonBg = this.add.graphics();
        closeButtonBg.fillStyle(0xff6b6b, 1);
        closeButtonBg.fillRoundedRect(-25, -25, 50, 50, 10);
        
        const closeButtonText = this.add.text(0, 0, '×', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.buttonForClose.add([closeButtonBg, closeButtonText]);
        this.buttonForClose.setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains);
        this.buttonForClose.on('pointerdown', () => {
            this.resume();
        });
        this.buttonForClose.setDepth(2);
        
        // 游戏介绍按钮
        const introButton = this.add.container(200, 650);
        const introButtonBg = this.add.graphics();
        introButtonBg.fillStyle(0x4ecdc4, 1);
        introButtonBg.fillRoundedRect(-60, -20, 120, 40, 10);
        
        const introButtonText = this.add.text(0, 0, '游戏介绍', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        introButton.add([introButtonBg, introButtonText]);
        introButton.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        introButton.on('pointerdown', () => {
            this.renderInfo(infoForIntro);
        });
        introButton.setDepth(2);
        
        // 操作说明按钮
        const operationButton = this.add.container(350, 650);
        const operationButtonBg = this.add.graphics();
        operationButtonBg.fillStyle(0x45b7d1, 1);
        operationButtonBg.fillRoundedRect(-60, -20, 120, 40, 10);
        
        const operationButtonText = this.add.text(0, 0, '操作说明', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        operationButton.add([operationButtonBg, operationButtonText]);
        operationButton.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        operationButton.on('pointerdown', () => {
            this.renderInfo(infoForOperation);
        });
        operationButton.setDepth(2);
        
        // 游戏目标按钮
        const targetButton = this.add.container(500, 650);
        const targetButtonBg = this.add.graphics();
        targetButtonBg.fillStyle(0x96ceb4, 1);
        targetButtonBg.fillRoundedRect(-60, -20, 120, 40, 10);
        
        const targetButtonText = this.add.text(0, 0, '游戏目标', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        targetButton.add([targetButtonBg, targetButtonText]);
        targetButton.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        targetButton.on('pointerdown', () => {
            this.renderTargets();
        });
        targetButton.setDepth(2);
    }
    
    /**
     * 创建主要内容区域
     */
    createMain() {
        // 主容器背景
        const mainBg = this.add.graphics();
        mainBg.fillStyle(0xffffff, 0.95);
        mainBg.fillRoundedRect(200, 150, 880, 450, 20);
        mainBg.setDepth(1);
        
        // 标题
        this.title = this.add.text(640, 200, '', {
            fontSize: '28px',
            color: '#2c3e50',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);
        
        // 内容
        this.content = this.add.text(640, 350, '', {
            fontSize: '18px',
            color: '#34495e',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5).setDepth(2);
        
        // 目标文本（用于显示游戏目标）
        this.targetText = this.add.text(640, 350, '', {
            fontSize: '16px',
            color: '#34495e',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5).setDepth(2);
    }
    
    /**
     * 恢复游戏（关闭弹窗）
     */
    resume() {
        this.scene.resume('FrontEndGame');
        this.scene.stop();
    }
    
    /**
     * 渲染信息内容
     * @param info 要显示的信息对象
     */
    renderInfo(info: Info) {
        this.title.setText(info.title);
        this.content.setText(info.content);
        this.content.setVisible(true);
        this.targetText.setVisible(false);
    }
    
    /**
     * 渲染游戏目标
     */
    renderTargets(): void {
        this.title.setText('游戏目标');
        this.content.setVisible(false);
        this.targetText.setVisible(true);
        
        let targetContent = '完成以下前端技术的学习目标(根据难度随机产生)：\n\n';
        
        const colorNames: { [color: number]: string } = {
            0xFFB366: 'HTML（橙色）',
            0xFFD93D: 'CSS（黄色）',
            0xFF6B9D: 'JavaScript（粉色）',
            0x87CEEB: 'React（蓝色）',
            0x90EE90: 'Vue（绿色）',
            0xFF7F7F: '性能优化（红色）',
            0xDDA0DD: '页面美化（淡紫色）'
        };
        
        for (const [color, target] of Object.entries(this.gameTargets)) {
            const colorNum = parseInt(color);
            const colorName = colorNames[colorNum] || `颜色${colorNum}`;
            targetContent += `${colorName}: 消除 ${target * 5} 个方块\n`;
        }
        
        targetContent += '\n提示：每消除5个相同颜色的方块算作完成1组目标！';
        
        this.targetText.setText(targetContent);
    }
    
    /**
     * 销毁元素
     */
    destroyElement() {
        if (this.bg) this.bg.destroy();
        if (this.buttonForClose) this.buttonForClose.destroy();
        if (this.title) this.title.destroy();
        if (this.content) this.content.destroy();
        if (this.targetText) this.targetText.destroy();
    }
}