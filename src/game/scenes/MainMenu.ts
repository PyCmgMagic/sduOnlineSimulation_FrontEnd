import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    // 背景和装饰元素
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    subtitle: GameObjects.Text;
    
    // 菜单按钮
    startButton: GameObjects.Container;
    settingsButton: GameObjects.Container;
    
    // 动画效果
    logoTween: Phaser.Tweens.Tween | null;
    titleTween: Phaser.Tweens.Tween | null;
    buttonTweens: Phaser.Tweens.Tween[] = [];
    
    // 装饰元素
    stars: GameObjects.Graphics[] = [];
    particles: GameObjects.Graphics[] = [];
    
    // 音频（预留）
    backgroundMusic: Phaser.Sound.BaseSound | null;
    
    // 颜色主题
    private colors = {
        primary: '#FF6B6B',
        secondary: '#4ECDC4', 
        accent: '#FFE66D',
        text: '#5D4037',
        textLight: '#8D6E63',
        background: '#FFF8E1',
        button: '#95E1D3',
        buttonHover: '#7FD8C7'
    };

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // 创建背景
        this.createBackground();
        
        // 创建装饰元素
        this.createDecorations();
        
        // 创建标题
        this.createTitle();
        
        // 创建菜单按钮
        this.createMenuButtons();
        
        // 启动动画
        this.startAnimations();
        
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
        this.background = this.add.image(512, 384, 'background');
        
        // 确保背景图片填充整个屏幕
        const scaleX = this.cameras.main.width / this.background.width;
        const scaleY = this.cameras.main.height / this.background.height;
        const scale = Math.max(scaleX, scaleY); 
        this.background.setScale(scale);
        
        // 添加半透明遮罩以增强文字可读性
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.3);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setDepth(1);
    }

    /**
     * 创建装饰元素 - 星星和粒子效果
     */
    private createDecorations(): void
    {
        // 创建闪烁的星星
        for (let i = 0; i < 8; i++) {
            const x = 50 + Math.random() * (this.cameras.main.width - 100);
            const y = 50 + Math.random() * (this.cameras.main.height - 100);
            
            const star = this.add.graphics();
            star.fillStyle(0xFFFFFF, 0.8);
            
            // 绘制五角星
            star.beginPath();
            for (let j = 0; j < 5; j++) {
                const angle = (j * 72 - 90) * Math.PI / 180;
                const outerRadius = 8;
                const innerRadius = 4;
                
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                const innerAngle = ((j + 0.5) * 72 - 90) * Math.PI / 180;
                const innerX = Math.cos(innerAngle) * innerRadius;
                const innerY = Math.sin(innerAngle) * innerRadius;
                
                if (j === 0) {
                    star.moveTo(outerX, outerY);
                } else {
                    star.lineTo(outerX, outerY);
                }
                star.lineTo(innerX, innerY);
            }
            star.closePath();
            star.fillPath();
            star.setPosition(x, y);
            star.setDepth(2);
            
            this.stars.push(star);
            
            // 添加闪烁动画
            this.tweens.add({
                targets: star,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0.3,
                duration: 1000 + Math.random() * 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // 创建漂浮的粒子
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            
            const particle = this.add.graphics();
            particle.fillStyle(0x4ECDC4, 0.6);
            particle.fillCircle(0, 0, 3);
            particle.setPosition(x, y);
            particle.setDepth(1);
            
            this.particles.push(particle);
            
            // 添加漂浮动画
            this.tweens.add({
                targets: particle,
                x: x + (Math.random() - 0.5) * 200,
                y: y + (Math.random() - 0.5) * 200,
                duration: 3000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    /**
     * 创建标题
     */
    private createTitle(): void
    {
        // 主标题
        this.title = this.add.text(512, 180, 'SDU线上模拟经营', {
            fontFamily: 'Arial Black, SimHei, Microsoft YaHei',
            fontSize: 56,
            color: '#FFFFFF',
            stroke: '#FF6B6B',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(10);
        
        // 副标题
        this.subtitle = this.add.text(512, 240, '欢迎来到经营世界', {
            fontFamily: 'Arial, SimHei, Microsoft YaHei',
            fontSize: 24,
            color: '#FFE66D',
            stroke: '#5D4037',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(10);
        
        // 版本信息
        this.add.text(this.cameras.main.width - 20, this.cameras.main.height - 20, 'v1.0.0', {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#8D6E63'
        }).setOrigin(1).setDepth(10);
    }

    /**
     * 创建菜单按钮
     */
    private createMenuButtons(): void
    {
        const centerX = 512;
        const startY = 350;
        const buttonSpacing = 80;
        
        // 开始游戏按钮
        this.startButton = this.createButton(centerX, startY, '开始游戏', () => {
            this.startGame();
        });
        
        // 设置按钮
        this.settingsButton = this.createButton(centerX, startY + buttonSpacing, '游戏设置', () => {
            this.openSettings();
        });
    }

    /**
     * 创建按钮 
     */
    private createButton(x: number, y: number, text: string, callback: () => void): GameObjects.Container
    {
        const container = this.add.container(x, y);
        
        // 按钮背景 
        const buttonBg = this.add.image(0, 0, 'button-normal');
        buttonBg.setScale(1.2); 
        
        // 使用star图片作为装饰
        const leftStar = this.add.image(-80, 0, 'button-star');
        leftStar.setScale(0.25);
        leftStar.setTint(0xFFE66D);
        
        const rightStar = this.add.image(80, 0, 'button-star');
        rightStar.setScale(0.25);
        rightStar.setTint(0xFFE66D);
        
        // 按钮文字
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Arial Black, SimHei, Microsoft YaHei',
            fontSize: 20,
            color: '#5D4037',  // 深褐色，与米色按钮搭配
            stroke: '#FFFFFF',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        

        container.add([buttonBg, leftStar, rightStar, buttonText]);
        container.setDepth(10);
        container.setSize(buttonBg.width * 1.2, buttonBg.height * 1.2);
        
        // 设置交互
        container.setInteractive();
        
        // 鼠标悬停效果
        container.on('pointerover', () => {
            
            // 星星旋转动画
            this.tweens.add({
                targets: [leftStar, rightStar],
                rotation: Math.PI * 2,
                duration: 1000,
                ease: 'Power2'
            });
            
            // 悬停动画
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Power2'
            });
            
      
        });
        
        container.on('pointerout', () => {
            
            // 恢复原大小
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power2'
            });
            
            // 恢复按钮透明度
            this.tweens.add({
                targets: buttonBg,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // 点击效果
        container.on('pointerdown', () => {
            // 切换到按压状态的按钮图片
            buttonBg.setTexture('button-pressed');
            
            // 按钮缩放效果
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Power2'
            });
            
            // 星星缩放效果
            this.tweens.add({
                targets: [leftStar, rightStar],
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        container.on('pointerup', () => {
            // 恢复正常状态的按钮图片
            buttonBg.setTexture('button-normal');
            
            // 恢复按钮和星星大小
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power2'
            });
            
            this.tweens.add({
                targets: [leftStar, rightStar],
                scaleX: 0.25,
                scaleY: 0.25,
                duration: 100,
                ease: 'Power2'
            });
            
            // 执行回调
            callback();
        });
        
        return container;
    }

    /**
     * 启动动画效果
     */
    private startAnimations(): void
    {
        // 标题淡入动画
        this.title.setAlpha(0);
        this.subtitle.setAlpha(0);
        
        this.titleTween = this.tweens.add({
            targets: this.title,
            alpha: 1,
            y: this.title.y - 10,
            duration: 1500,
            ease: 'Power2'
        });
        
        this.tweens.add({
            targets: this.subtitle,
            alpha: 1,
            y: this.subtitle.y - 10,
            duration: 1500,
            delay: 500,
            ease: 'Power2'
        });
        
        // 按钮依次出现动画
        const buttons = [this.startButton, this.settingsButton];
        buttons.forEach((button, index) => {
            button.setAlpha(0);
            button.setX(button.x + 50);
            
            const tween = this.tweens.add({
                targets: button,
                alpha: 1,
                x: button.x - 50,
                duration: 800,
                delay: 1000 + index * 200,
                ease: 'Back.easeOut'
            });
            
            this.buttonTweens.push(tween);
        });
        
        // 标题呼吸效果
        this.tweens.add({
            targets: this.title,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
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
     * 打开设置
     */
    private openSettings(): void
    {
        console.log('⚙️ Opening settings...');
        
        // 播放按钮音效
        if (this.sound.get('buttonClick')) {
            this.sound.play('buttonClick');
        }
        
        // 这里可以创建设置界面或跳转到设置场景
        // 暂时显示一个简单的提示
        const settingsText = this.add.text(512, 600, '设置功能开发中...', {
            fontFamily: 'Arial, SimHei, Microsoft YaHei',
            fontSize: 18,
            color: '#FFE66D',
            stroke: '#5D4037',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(15);
        
        // 3秒后消失
        this.tweens.add({
            targets: settingsText,
            alpha: 0,
            duration: 500,
            delay: 2500,
            onComplete: () => {
                settingsText.destroy();
            }
        });
    }



    /**
     * 清理资源 - 在场景关闭时调用
     */
    private cleanupResources(): void
    {
        // 停止所有动画
        if (this.logoTween) {
            this.logoTween.stop();
        }
        if (this.titleTween) {
            this.titleTween.stop();
        }
        this.buttonTweens.forEach(tween => tween.stop());
        
        // 停止背景音乐
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        // 清理数组
        this.stars = [];
        this.particles = [];
        this.buttonTweens = [];
    }
}
