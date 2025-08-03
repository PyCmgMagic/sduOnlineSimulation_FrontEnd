import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    // 背景
    background: GameObjects.Image;
    
    // 菜单按钮
    startButton: GameObjects.Graphics;
    
    // 音频
    backgroundMusic: Phaser.Sound.BaseSound | null;

    // 设置按钮
    settingsButton: GameObjects.Image;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // 创建背景
        this.createBackground();
        //创建开始按钮区域
        this.createStartButtonArea();
        // 创建设置按钮
        this.createSettingsButton();
        // 设置音频（如果有的话）
        this.setupAudio();
        // 通知场景已准备好
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * 创建背景
     */
    private createBackground(): void
    {
        // 主背景图片
        this.background = this.add.image(0, 0, 'background');
        
        // 确保背景图片填充整个屏幕
        const scaleX = this.cameras.main.width / this.background.width;
        const scaleY = this.cameras.main.height / this.background.height;
        this.background.setScale(scaleX,scaleY).setOrigin(0, 0);
    }

    /** 
     * 创建开始按钮区域
     */
    private createStartButtonArea(): void
    {
        this.startButton = this.add.graphics();
        this.startButton.setScale(1.2);
        this.startButton.setDepth(10);
    
        // 画一个矩形按钮
        this.startButton.fillStyle(0x1890ff, 0); // 透明填充
        this.startButton.fillRoundedRect(0, 0, 220, 150, 10);
    
        // 设置位置
        this.startButton.setPosition(600, 500);
        this.startButton.rotation = Phaser.Math.DegToRad(-10);
    
        // 设置可交互区域
        this.startButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 200, 100), Phaser.Geom.Rectangle.Contains);
    
        // 绑定点击事件
        this.startButton.on('pointerdown', () => {
            this.startGame();
        });
    }
    
    /**
     * 创建设置按钮
     */
    private createSettingsButton(): void {
        this.settingsButton = this.add.image(this.cameras.main.width - 40, 40, 'settings');
        this.settingsButton.setOrigin(0.5);
        this.settingsButton.setScale(0.8); 
        this.settingsButton.setDepth(20);
        this.settingsButton.setInteractive({ useHandCursor: true });

        // 创建气泡提示
        const bubblePadding = 10;
        const bubbleText = this.add.text(0, 0, '设置', {
            fontSize: '20px',
            color: '#fff',
            fontFamily: '微软雅黑, Arial',
            align: 'center',
            backgroundColor: 'rgba(0,0,0,0)'
        });
        bubbleText.setOrigin(0.5);
        bubbleText.setDepth(30);
        bubbleText.setVisible(false);

        // 创建气泡背景
        const bubbleBg = this.add.graphics();
        bubbleBg.setDepth(29);
        bubbleBg.setVisible(false);

        // 悬停时显示气泡
        this.settingsButton.on('pointerover', () => {
            // 计算气泡位置
            const x = this.settingsButton.x;
            const y = this.settingsButton.y + this.settingsButton.displayHeight / 2 + 20;
            bubbleText.setPosition(x, y);
            // 绘制背景
            const textWidth = bubbleText.width + bubblePadding * 2;
            const textHeight = bubbleText.height + bubblePadding * 2;
            bubbleBg.clear();
            bubbleBg.fillStyle(0x222222, 0.9);
            bubbleBg.fillRoundedRect(x - textWidth / 2, y - textHeight / 2, textWidth, textHeight, 8);
            bubbleBg.setVisible(true);
            bubbleText.setVisible(true);
        });
        // 移出时隐藏气泡
        this.settingsButton.on('pointerout', () => {
            bubbleText.setVisible(false);
            bubbleBg.setVisible(false);
        }); 
        // 点击事件
        this.settingsButton.on('pointerdown', () => {
            console.log('⚙️ 设置按钮被点击');
        });
    }

    /**
     * 设置音频
     */
    private setupAudio(): void
    {
        // 如果有背景音乐资源的话
        if (this.sound.get('menuMusic')) {
            this.backgroundMusic = this.sound.add('menuMusic', {
                volume: 0.5,
                loop: true
            });
            // this.backgroundMusic.play();
        }
    }

    /**
     * 开始游戏
     */
    private startGame(): void
    {
        console.log('🎮 Starting game...');
        
        // 播放按钮音效
        if (this.sound.get('buttonClick')) {
            this.sound.play('buttonClick');
        }
        
        // 停止背景音乐
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        // 场景转换动画
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.cleanupResources();
            this.scene.start('Game');
        });
    }
    

    /**
     * 清理资源 - 在场景关闭时调用
     */
    private cleanupResources(): void
    {
        // 停止背景音乐
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
    }
}