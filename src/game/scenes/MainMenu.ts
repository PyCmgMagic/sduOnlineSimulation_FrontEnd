import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    // 背景
    background: GameObjects.Image;
     // 开始按钮
    startButton: GameObjects.Image;
    // 菜单按钮
    startButtonArea: GameObjects.Graphics;
    
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
        this.createStartButton()
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
     * 创建开始按钮
     */
private createStartButton(): void {
    // 创建按钮图片，初始位置可以随意，因为我们马上会重新定位它
    this.startButton = this.add.image(0, 0, 'start-button');
    
    // --- 1. 定位按钮 ---
    // 获取屏幕的中心点坐标
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    // 将按钮设置在屏幕中心
    this.startButton.setPosition(centerX+250, centerY+168);

    this.startButton.setOrigin(0.5); // 设置锚点为中心，这样缩放和定位都以中心为准
    this.startButton.setScale(0.25);  // 设置初始大小
    this.startButton.setDepth(20);   // 确保按钮在最上层
    this.startButton.setInteractive({ useHandCursor: true }); // 设置交互并显示手形光标

    // 鼠标按下时的事件
    this.startButton.on('pointerdown', () => {
        // 创建一个短暂的 "按下" 动画
        this.tweens.add({
            targets: this.startButton,
            scale: 0.23, // 按下时稍微再缩小一点
            duration: 100, // 动画持续时间（毫秒）
            ease: 'Power1', // 缓动函数，使动画更自然
            onComplete: () => {
                // 按下动画完成后立即开始游戏
                this.startGame();
            }
        });
    });

    // 鼠标悬停时的事件
    this.startButton.on('pointerover', () => {
        // 创建一个平滑放大的动画
        this.tweens.add({
            targets: this.startButton,
            scale: 0.32, // 目标大小
            duration: 200, // 动画持续时间
            ease: 'Power2' // 使用一个更有弹性的缓动函数
        });
    });

    // 鼠标离开时的事件
    this.startButton.on('pointerout', () => {
        // 创建一个平滑恢复到原始大小的动画
        this.tweens.add({
            targets: this.startButton,
            scale: 0.25, // 恢复到初始大小
            duration: 200,
            ease: 'Power2'
        });
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