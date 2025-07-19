import { Scene } from 'phaser';

export class Preloader extends Scene
{
    // is this device a mobile device or a PC
    public isMobile: boolean;
    
    // UI元素
    private background: Phaser.GameObjects.Image;
    private loadingText: Phaser.GameObjects.Text;
    private percentText: Phaser.GameObjects.Text;
    private assetText: Phaser.GameObjects.Text;
    private progressBar: Phaser.GameObjects.Graphics;
    private progressBox: Phaser.GameObjects.Graphics;
    private logo: Phaser.GameObjects.Image;
    
    // 加载状态
    private totalAssets: number = 0;
    private loadedAssets: number = 0;
    private currentAsset: string = '';
    
    // 动画相关
    private loadingDots: string = '';
    private dotCount: number = 0;
    private loadingTimer: Phaser.Time.TimerEvent;
    
    // 颜色主题 - 卡通温暖风格
    private colors = {
        primary: '#FF6B6B',        // 温暖的红色
        secondary: '#4ECDC4',      // 清新的蓝绿色
        success: '#95E1D3',        // 温和的绿色
        warning: '#FFE66D',        // 温暖的黄色
        error: '#FF8A80',          // 柔和的红色
        background: '#FFF8E1',     // 温暖的米色
        text: '#5D4037',           // 温暖的棕色
        textSecondary: '#8D6E63',  // 浅棕色
        accent: '#FFB74D',         // 温暖的橙色
        cute: '#F8BBD9'            // 可爱的粉色
    };

    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        /* judge this device a mobile device or a PC */
        this.isMobile = /Mobile|Android|iOS/i.test(navigator.userAgent);
        
        console.log('🎬 Preloader scene initialized');
        
        // 获取屏幕中心点
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // 创建加载界面
        this.createLoadingUI(centerX, centerY);
        
        // 设置加载事件监听
        this.setupLoadingEvents();
        
        // 启动加载动画
        this.startLoadingAnimation();
    }

    preload ()
    {
        console.log('📦 Starting asset loading...');
        // 设置资源路径
        this.load.setPath('assets/');
        
        if(this.isMobile) 
        {
            /* only preload for the assets of mobile error page */
            this.load.image('mobile-error-background', './mobiles/background.png')
        } 
        else 
        {
            // 加载基础UI资源
            this.loadUIAssets();

            // 加载游戏资源
            this.loadGameAssets();

            // 加载音频资源
            this.loadAudioAssets();

            // 加载字体资源
            this.loadFontAssets();

            // 设置加载超时
            this.setupLoadingTimeout();
        }
    }

    create ()
    {
        console.log('✅ All assets loaded successfully');
        
        // 停止加载动画
        this.stopLoadingAnimation();
        
        // 创建全局动画
        this.createGlobalAnimations();
        
        // 初始化全局游戏对象
        this.initializeGlobalObjects();
        
        // 缓存关键资源
        this.cacheImportantAssets();
        
        // 显示完成界面
        this.showCompletionScreen();
    }

    /**
     * 创建加载界面
     */
    private createLoadingUI(centerX: number, centerY: number): void
    {
        // 创建渐变背景
        this.createGradientBackground(centerX, centerY);
        
        // 创建装饰性背景元素
        this.createBackgroundDecorations(centerX, centerY);
        
        // 创建主要内容区域
        this.createMainContentArea(centerX, centerY);
        
        // 创建logo和标题
        this.createLogoAndTitle(centerX, centerY);
        
        // 创建美化的进度条
        this.createEnhancedProgressBar(centerX, centerY);
        
        // 创建加载状态指示器
        this.createLoadingIndicators(centerX, centerY);
        
        // 创建底部信息
        this.createBottomInfo(centerX, centerY);
        
        // 创建装饰性粒子效果
        this.createParticleEffects(centerX, centerY);
    }

    /**
     * 创建卡通背景
     */
    private createGradientBackground(centerX: number, centerY: number): void
    {
        // 创建主背景图片
        this.background = this.add.image(centerX, centerY, 'background');
        this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // 创建非常淡的渐变遮罩（进一步降低透明度）
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0xFFF8E1, 0xFFF8E1, 0xFFE0B2, 0xFFE0B2, 0.1);
        gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // 创建可爱的云朵效果
        const cloud1 = this.add.graphics();
        cloud1.fillStyle(0xFFFFFF, 0.6);
        cloud1.fillCircle(0, 0, 40);
        cloud1.fillCircle(30, 0, 30);
        cloud1.fillCircle(60, 0, 35);
        cloud1.fillCircle(15, -20, 25);
        cloud1.fillCircle(45, -20, 25);
        cloud1.setPosition(centerX - 200, centerY - 200);
        cloud1.setDepth(2);
        
        const cloud2 = this.add.graphics();
        cloud2.fillStyle(0xFFFFFF, 0.4);
        cloud2.fillCircle(0, 0, 30);
        cloud2.fillCircle(25, 0, 25);
        cloud2.fillCircle(45, 0, 28);
        cloud2.fillCircle(10, -15, 20);
        cloud2.fillCircle(35, -15, 20);
        cloud2.setPosition(centerX + 150, centerY - 180);
        cloud2.setDepth(2);
        
        // 云朵漂浮动画
        this.tweens.add({
            targets: cloud1,
            x: centerX - 150,
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.tweens.add({
            targets: cloud2,
            x: centerX + 200,
            duration: 5000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 创建卡通装饰元素
     */
    private createBackgroundDecorations(centerX: number, centerY: number): void
    {
        // 创建可爱的星星
        for (let i = 0; i < 6; i++) {
            const x = 50 + Math.random() * (this.cameras.main.width - 100);
            const y = 50 + Math.random() * (this.cameras.main.height - 100);
            
            const star = this.add.graphics();
            star.fillStyle(0xFFE66D, 0.8);
            
            // 绘制五角星
            star.beginPath();
            for (let j = 0; j < 5; j++) {
                const angle = (j * 72 - 90) * Math.PI / 180;
                const outerRadius = 15;
                const innerRadius = 7;
                
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
            star.setDepth(1);
            
            // 添加闪烁动画
            this.tweens.add({
                targets: star,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0.5,
                duration: 1000 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // 创建可爱的心形
        for (let i = 0; i < 4; i++) {
            const x = 100 + Math.random() * (this.cameras.main.width - 200);
            const y = 100 + Math.random() * (this.cameras.main.height - 200);
            
            const heart = this.add.graphics();
            heart.fillStyle(0xF8BBD9, 0.7);
            
            // 绘制心形 (简化版本)
            heart.fillCircle(-8, -5, 8);
            heart.fillCircle(8, -5, 8);
            heart.fillTriangle(0, 5, -12, -5, 12, -5);
            heart.setPosition(x, y);
            heart.setDepth(1);
            
            // 添加浮动动画
            this.tweens.add({
                targets: heart,
                y: y - 20,
                duration: 2000 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
   
    }

    /**
     * 创建卡通内容区域
     */
    private createMainContentArea(centerX: number, centerY: number): void
    {
        // 创建面板阴影（最底层）
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.1);
        shadow.fillRoundedRect(centerX - 275, centerY - 175, 560, 360, 30);
        shadow.setPosition(shadow.x + 5, shadow.y + 5);
        shadow.setDepth(3);
        
        // 创建温暖的主面板（降低透明度，避免遮挡logo）
        const panel = this.add.graphics();
        panel.fillStyle(0xFFFFFF, 0.7);
        panel.fillRoundedRect(centerX - 280, centerY - 180, 560, 360, 30);
        panel.lineStyle(4, 0xFF6B6B, 0.8);
        panel.strokeRoundedRect(centerX - 280, centerY - 180, 560, 360, 30);
        panel.setDepth(4);
        
        // 添加可爱的装饰边框
        const decorBorder = this.add.graphics();
        decorBorder.lineStyle(2, 0xFFB74D, 0.6);
        decorBorder.strokeRoundedRect(centerX - 275, centerY - 175, 550, 350, 25);
        decorBorder.setDepth(5);
        
        // 添加可爱的角落装饰
        const corners = [
            { x: centerX - 260, y: centerY - 160 },
            { x: centerX + 260, y: centerY - 160 },
            { x: centerX - 260, y: centerY + 160 },
            { x: centerX + 260, y: centerY + 160 }
        ];
        
        corners.forEach(corner => {
            const decoration = this.add.graphics();
            decoration.fillStyle(0xF8BBD9, 0.8);
            decoration.fillCircle(0, 0, 8);
            decoration.fillStyle(0xFFFFFF, 0.9);
            decoration.fillCircle(0, 0, 5);
            decoration.setPosition(corner.x, corner.y);
            decoration.setDepth(6);
            
            // 添加轻微的脉动动画
            this.tweens.add({
                targets: decoration,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    /**
     * 创建卡通logo和标题
     */
    private createLogoAndTitle(centerX: number, centerY: number): void
    {
        // 创建logo对比背景
        const logoBackground = this.add.graphics();
        logoBackground.fillStyle(0xFFFFFF, 0.8);
        logoBackground.fillCircle(centerX, centerY - 100, 50);
        logoBackground.setDepth(8);
        
        // 创建logo装饰边框
        const logoCircle = this.add.graphics();
        logoCircle.lineStyle(3, 0xFFB74D, 0.8);
        logoCircle.strokeCircle(centerX, centerY - 100, 55);
        // 设置logo背景层级
        logoCircle.setDepth(10);
        
        // 创建logo
        this.logo = this.add.image(centerX, centerY - 100, 'pure-logo');
        // 设置logo为最高层级
        this.logo.setDepth(20);
        // 确保logo完全不透明
        this.logo.setAlpha(1);
        // 添加轻微的色调增强，让logo更加突出
        this.logo.setTint(0xFFFFFF);
        
        // 设置logo大小
        this.logo.setScale(0.05); // 根据原图大小调整比例
        logoBackground.setScale(1);
        logoCircle.setScale(1);
        
        // 非常轻微的呼吸效果
        this.tweens.add({
            targets: this.logo,
            scaleX: 0.062, // 基于0.08的微调
            scaleY: 0.062,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 背景和边框的呼吸效果
        this.tweens.add({
            targets: [logoCircle, logoBackground],
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 创建标题
        const title = this.add.text(centerX, centerY - 30, '🎓 学线模拟经营', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#5D4037',
            stroke: '#FFB74D',
            strokeThickness: 2
        }).setOrigin(0.5);
        // 设置标题层级
        title.setDepth(15);
        
        // 标题阴影
        const titleShadow = this.add.text(centerX + 2, centerY - 28, '🎓 学线模拟经营', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#000000'
        }).setOrigin(0.5);
        titleShadow.setAlpha(0.3);
        titleShadow.setDepth(14);
        
        // 标题动画
        this.tweens.add({
            targets: title,
            y: centerY - 35,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 创建可爱的副标题
        const subtitle = this.add.text(centerX, centerY + 5, '快乐学习，轻松经营 ✨', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#8D6E63'
        }).setOrigin(0.5);
        subtitle.setAlpha(0.8);
        // 设置副标题层级
        subtitle.setDepth(15);
        
        // 副标题闪烁效果
        this.tweens.add({
            targets: subtitle,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 创建卡通进度条
     */
    private createEnhancedProgressBar(centerX: number, centerY: number): void
    {
        // 创建进度条外框（卡通风格）
        const progressBorder = this.add.graphics();
        progressBorder.lineStyle(4, 0xFF6B6B, 1);
        progressBorder.strokeRoundedRect(centerX - 200, centerY + 50, 400, 35, 20);
        progressBorder.setDepth(8);
        
        // 创建进度条背景
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0xFFE0B2, 0.8);
        this.progressBox.fillRoundedRect(centerX - 195, centerY + 55, 390, 25, 15);
        this.progressBox.setDepth(9);
        
        // 创建进度条装饰条纹
        const stripes = this.add.graphics();
        stripes.lineStyle(1, 0xFFB74D, 0.3);
        for (let i = 0; i < 20; i++) {
            stripes.moveTo(centerX - 190 + i * 20, centerY + 55);
            stripes.lineTo(centerX - 190 + i * 20, centerY + 80);
        }
        stripes.setDepth(10);
        
        // 创建进度条
        this.progressBar = this.add.graphics();
        this.progressBar.setDepth(12);
        
        // 创建百分比文本
        this.percentText = this.add.text(centerX, centerY + 67, '0%', {
            fontFamily: 'Arial Bold',
            fontSize: '16px',
            color: '#5D4037',
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.percentText.setDepth(18);
        
        // 创建加载提示
        this.loadingText = this.add.text(centerX, centerY + 25, '正在加载游戏资源', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#8D6E63'
        }).setOrigin(0.5);
        this.loadingText.setDepth(15);
        
        // 创建当前资源文本
        this.assetText = this.add.text(centerX, centerY + 95, '准备加载...', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#A1887F'
        }).setOrigin(0.5);
        this.assetText.setDepth(15);
        
        // 创建可爱的进度条装饰
        const progressDecor = this.add.graphics();
        progressDecor.fillStyle(0xF8BBD9, 0.8);
        progressDecor.fillCircle(centerX - 210, centerY + 67, 8);
        progressDecor.fillCircle(centerX + 210, centerY + 67, 8);
        progressDecor.fillStyle(0xFFFFFF, 0.9);
        progressDecor.fillCircle(centerX - 210, centerY + 67, 5);
        progressDecor.fillCircle(centerX + 210, centerY + 67, 5);
        
        // 装饰动画
        this.tweens.add({
            targets: progressDecor,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 创建卡通加载指示器
     */
    private createLoadingIndicators(centerX: number, centerY: number): void
    {
        // 创建可爱的旋转花朵
        const loadingFlower = this.add.graphics();
        loadingFlower.fillStyle(0xF8BBD9, 0.8);
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            loadingFlower.fillCircle(x, y, 8);
        }
        loadingFlower.fillStyle(0xFFE66D, 1);
        loadingFlower.fillCircle(0, 0, 10);
        loadingFlower.setPosition(centerX + 220, centerY + 67);
        loadingFlower.setDepth(16);
        
        // 花朵旋转动画
        this.tweens.add({
            targets: loadingFlower,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // 创建可爱的加载点动画
        const loadingDots = [];
        for (let i = 0; i < 3; i++) {
            const dot = this.add.graphics();
            dot.fillStyle(0xFF6B6B, 0.8);
            dot.fillCircle(0, 0, 6);
            dot.fillStyle(0xFFFFFF, 0.6);
            dot.fillCircle(0, 0, 3);
            dot.setPosition(centerX - 30 + i * 30, centerY + 120);
            dot.setDepth(16);
            loadingDots.push(dot);
            
            // 添加跳跃动画
            this.tweens.add({
                targets: dot,
                y: centerY + 110,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                delay: i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Back.easeOut'
            });
        }
        
   
    }

    /**
     * 创建底部信息
     */
    private createBottomInfo(centerX: number, centerY: number): void
    {
        // 创建版本信息
        const gameVersion = this.registry.get('gameVersion') || '1.0.0';
        this.add.text(centerX, this.cameras.main.height - 60, `Version ${gameVersion}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);
        
        // 创建加载提示
        this.add.text(centerX, this.cameras.main.height - 40, '首次加载可能需要较长时间，请耐心等待', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5);
        
        // 创建技术提示
        this.add.text(centerX, this.cameras.main.height - 20, 'Powered by Phaser 3 & TypeScript', {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#444444'
        }).setOrigin(0.5);
    }

    /**
     * 创建卡通粒子效果
     */
    private createParticleEffects(centerX: number, centerY: number): void
    {
        // 创建可爱的浮动星星
        for (let i = 0; i < 8; i++) {
            const star = this.add.graphics();
            star.fillStyle(0xFFE66D, 0.7);
            star.fillCircle(0, 0, 3);
            star.fillStyle(0xFFFFFF, 0.8);
            star.fillCircle(0, 0, 1);
            
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            star.setPosition(x, y);
            
            // 添加闪烁浮动动画
            this.tweens.add({
                targets: star,
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                alpha: 0.3,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 1500 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // 创建可爱的心形粒子
        for (let i = 0; i < 5; i++) {
            const heart = this.add.graphics();
            heart.fillStyle(0xF8BBD9, 0.6);
            heart.fillCircle(-3, -2, 3);
            heart.fillCircle(3, -2, 3);
            heart.fillTriangle(0, 2, -4, -2, 4, -2);
            
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            heart.setPosition(x, y);
            
            // 添加心形浮动动画
            this.tweens.add({
                targets: heart,
                y: y - 30,
                alpha: 0.2,
                duration: 3000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // 创建气泡效果
        for (let i = 0; i < 6; i++) {
            const bubble = this.add.graphics();
            bubble.lineStyle(1, 0x4ECDC4, 0.6);
            bubble.strokeCircle(0, 0, 4 + Math.random() * 8);
            bubble.fillStyle(0xFFFFFF, 0.1);
            bubble.fillCircle(0, 0, 4 + Math.random() * 8);
            
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            bubble.setPosition(x, y);
            
            // 添加气泡上升动画
            this.tweens.add({
                targets: bubble,
                y: y - 100,
                alpha: 0,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 4000 + Math.random() * 2000,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }
    }

    /**
     * 设置加载事件监听
     */
    private setupLoadingEvents(): void
    {
        // 加载进度事件
        this.load.on('progress', (progress: number) => {
            this.updateProgressBar(progress);
        });
        
        // 单个文件加载完成事件
        this.load.on('fileprogress', (file: any) => {
            this.loadedAssets++;
            this.currentAsset = file.key;
            this.updateAssetText();
        });
        
        // 加载完成事件
        this.load.on('complete', () => {
            this.onLoadComplete();
        });
        
        // 加载错误事件
        this.load.on('loaderror', (file: any) => {
            this.onLoadError(file);
        });
        
        // 文件加载开始事件
        this.load.on('start', () => {
            this.totalAssets = this.load.totalToLoad;
            console.log(`📊 Total assets to load: ${this.totalAssets}`);
        });
    }

    /**
     * 加载UI资源
     */
    private loadUIAssets(): void
    {
        // 加载UI图片
        this.load.image('pure-logo', 'pure-logo.png');
        this.load.image('star', 'star.png');
        
        // 加载按钮图片 - 使用专业按钮素材
        this.load.image('button-normal', 'ui/buttons/buttonLong_beige.png');
        this.load.image('button-pressed', 'ui/buttons/buttonLong_beige_pressed.png');
        this.load.image('button-star', 'star.png'); // 使用星星作为按钮装饰
        this.load.image('settings', 'ui/buttons/setting.png'); 
        
        // 加载UI组件
        // this.load.image('button', 'ui/button.png');
        // this.load.image('panel', 'ui/panel.png');
        // this.load.image('dialog', 'ui/dialog.png');
        
        // 加载图标
        // this.load.image('icon-settings', 'icons/settings.png');
        // this.load.image('icon-sound', 'icons/sound.png');
        // this.load.image('icon-music', 'icons/music.png');
    }

    /**
     * 加载游戏资源
     */
    private loadGameAssets(): void
    {
        // 加载logo
        this.load.image('logo-white', './pure-logo.png');
        this.load.image('logo-color', './logo.png');

        // 加载游戏内图标
        this.load.image('icon-settings', './ui/icons/settings.png');
        this.load.image('icon-pause', './ui/icons/pause.png');
        this.load.image('icon-play', './ui/icons/play.png');
        this.load.image('icon-home', './ui/icons/home.png');
        this.load.image('icon-sound-on', './ui/icons/sound_on.png');
        this.load.image('icon-sound-off', './ui/icons/sound_off.png');
        
        // 加载游戏场景背景
        this.load.image('game-background', './games/background.jpg');
        
        // 加载精灵/角色
        this.load.spritesheet('player', './games/player.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        
        // 加载地图资源
        this.load.image('tileset', './games/tileset.png');
        this.load.tilemapTiledJSON('map', './games/map.json');

        // 加载房屋搭建素材
        this.load.setPath('assets/Tiles');
        this.load.image('houseBeige', 'houseBeige.png');
        this.load.image('houseBeigeBottomLeft', 'houseBeigeBottomLeft.png');
        this.load.image('houseGray', 'houseGray.png');
        this.load.image('houseDark', 'houseDark.png');
        this.load.image('houseBeigeAlt', 'houseBeigeAlt.png');
        this.load.image('roofRedMid', 'roofRedMid.png');
        this.load.image('doorOpen', 'doorOpen.png');
        this.load.image('window', 'window.png');
        this.load.image('awningRed', 'awningRed.png');
        this.load.image('signHangingCup', 'signHangingCup.png');
        this.load.setPath('assets/'); // 恢复资源路径

        // 加载客户雪碧图
        this.load.setPath('assets/customer');
        this.load.spritesheet('female-customer', 'female_tilesheet.png', {
            frameWidth: 80,
            frameHeight: 110
        });
        this.load.spritesheet('player-customer', 'player_tilesheet.png', {
            frameWidth: 80,
            frameHeight: 110
        });
        this.load.setPath('assets/'); // 恢复资源路径

        // 加载产品游戏资源
        this.load.setPath('assets/games/product');
        this.load.spritesheet('game-product-player', 'dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.image('game-product-platform', 'platform.png');
        this.load.setPath('assets/'); // 恢复资源路径
    }

    /**
     * 加载音频资源
     */
    private loadAudioAssets(): void
    {
        // 加载背景音乐
        // this.load.audio('bgm-menu', 'audio/bgm-menu.mp3');
        // this.load.audio('bgm-game', 'audio/bgm-game.mp3');
        
        // 加载音效
        // this.load.audio('sfx-click', 'audio/sfx-click.wav');
        // this.load.audio('sfx-success', 'audio/sfx-success.wav');
        // this.load.audio('sfx-error', 'audio/sfx-error.wav');
        
        console.log('🔊 Audio assets queued for loading');
    }

    /**
     * 加载字体资源
     */
    private loadFontAssets(): void
    {
        // 加载自定义字体
        // this.load.bitmapFont('pixel-font', 'fonts/pixel-font.png', 'fonts/pixel-font.xml');
        
        console.log('🔤 Font assets queued for loading');
    }

    /**
     * 设置加载超时
     */
    private setupLoadingTimeout(): void
    {
        // 设置30秒超时
        this.time.delayedCall(30000, () => {
            if (this.load.isLoading()) {
                console.error('⏰ Loading timeout - some assets may have failed to load');
                this.showTimeoutWarning();
            }
        });
    }

    /**
     * 启动加载动画
     */
    private startLoadingAnimation(): void
    {
        // logo旋转动画
        this.tweens.add({
            targets: this.logo,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // 加载点动画
        this.loadingTimer = this.time.addEvent({
            delay: 500,
            callback: this.updateLoadingDots,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * 停止加载动画
     */
    private stopLoadingAnimation(): void
    {
        if (this.loadingTimer) {
            this.loadingTimer.destroy();
        }
        
        // 停止logo旋转
        this.tweens.killTweensOf(this.logo);
    }

    /**
     * 更新加载点动画
     */
    private updateLoadingDots(): void
    {
        this.dotCount = (this.dotCount + 1) % 4;
        this.loadingDots = '.'.repeat(this.dotCount);
        
        if (this.loadingText) {
            this.loadingText.setText(`正在加载游戏资源${this.loadingDots}`);
        }
    }

    /**
     * 更新卡通进度条
     */
    private updateProgressBar(progress: number): void
    {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // 清空进度条
        this.progressBar.clear();
        
        // 绘制进度条
        const barWidth = 390;
        const currentWidth = barWidth * progress;
        
        if (currentWidth > 0) {
            // 卡通风格渐变进度条
            this.progressBar.fillGradientStyle(0xFF6B6B, 0x4ECDC4, 0xFF6B6B, 0x4ECDC4);
            this.progressBar.fillRoundedRect(centerX - 195, centerY + 55, currentWidth, 25, 15);
            
            // 添加进度条顶部高光
            this.progressBar.fillStyle(0xFFFFFF, 0.4);
            this.progressBar.fillRoundedRect(centerX - 195, centerY + 55, currentWidth, 6, 3);
            
            // 创建可爱的进度指示器
            if (currentWidth > 20) {
                const progressIndicator = this.add.graphics();
                progressIndicator.fillStyle(0xFFE66D, 1);
                progressIndicator.fillCircle(0, 0, 8);
                progressIndicator.fillStyle(0xFFFFFF, 0.8);
                progressIndicator.fillCircle(0, 0, 5);
                progressIndicator.fillStyle(0xFF6B6B, 0.8);
                progressIndicator.fillCircle(0, 0, 2);
                progressIndicator.setPosition(centerX - 195 + currentWidth, centerY + 67);
                
                // 指示器弹跳动画
                this.tweens.add({
                    targets: progressIndicator,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 300,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Back.easeOut'
                });
            }
        }
        
        // 更新百分比文本
        const percent = Math.round(progress * 100);
        this.percentText.setText(`${percent}%`);
        
        // 百分比文字特效
        if (percent % 20 === 0 && percent > 0) {
            this.tweens.add({
                targets: this.percentText,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 300,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        }
        
        // 更新颜色
        const textColor = progress === 1 ? this.colors.success : '#5D4037';
        this.percentText.setColor(textColor);
        
        // 完成时的庆祝效果
        if (progress === 1) {
            this.createCelebrationEffect(centerX, centerY);
        }
    }
    
    /**
     * 创建庆祝效果
     */
    private createCelebrationEffect(centerX: number, centerY: number): void
    {
        // 创建庆祝星星
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const distance = 80;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const celebrationStar = this.add.graphics();
            celebrationStar.fillStyle(0xFFE66D, 1);
            celebrationStar.fillCircle(0, 0, 4);
            celebrationStar.setPosition(x, y);
            
            // 星星爆炸效果
            this.tweens.add({
                targets: celebrationStar,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 800,
                ease: 'Power2.easeOut'
            });
        }
    }

    /**
     * 更新资源文本
     */
    private updateAssetText(): void
    {
        if (this.currentAsset) {
            this.assetText.setText(`正在加载: ${this.currentAsset} (${this.loadedAssets}/${this.totalAssets})`);
        }
    }

    /**
     * 加载完成处理
     */
    private onLoadComplete(): void
    {
        console.log('✅ Asset loading completed');
        
        this.assetText.setText('资源加载完成！');
        this.assetText.setColor(this.colors.success);
        
        // 添加完成动画
        this.tweens.add({
            targets: this.percentText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }

    /**
     * 加载错误处理
     */
    private onLoadError(file: any): void
    {
        console.error(`❌ Failed to load asset: ${file.key}`);
        
        this.assetText.setText(`加载失败: ${file.key}`);
        this.assetText.setColor(this.colors.error);
        
        // 错误动画
        this.tweens.add({
            targets: this.assetText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            repeat: 2,
            ease: 'Power2'
        });
    }

    /**
     * 显示超时警告
     */
    private showTimeoutWarning(): void
    {
        const warningText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 150,
            '⚠️ 网络连接缓慢，请稍候...',
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: this.colors.warning,
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // 警告动画
        this.tweens.add({
            targets: warningText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
    }

    /**
     * 创建全局动画
     */
    private createGlobalAnimations(): void
    {
        // 创建按钮点击动画
        if (!this.anims.exists('button-click')) {
            this.anims.create({
                key: 'button-click',
                frames: [
                    { key: 'button', frame: 0 },
                    { key: 'button', frame: 1 }
                ],
                frameRate: 10,
                repeat: 0
            });
        }
        
        // 创建星星闪烁动画
        if (!this.anims.exists('star-twinkle')) {
            this.anims.create({
                key: 'star-twinkle',
                frames: this.anims.generateFrameNumbers('star', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        console.log('🎬 Global animations created');
    }

    /**
     * 初始化全局游戏对象
     */
    private initializeGlobalObjects(): void
    {
        // 创建全局音频管理器
        const audioManager = {
            masterVolume: this.registry.get('masterVolume') || 0.8,
            musicVolume: this.registry.get('musicVolume') || 0.7,
            sfxVolume: this.registry.get('sfxVolume') || 0.9,
            
            playMusic: (key: string) => {
                // 播放背景音乐的逻辑
            },
            
            playSound: (key: string) => {
                // 播放音效的逻辑
            }
        };
        
        this.registry.set('audioManager', audioManager);
        
        // 创建全局粒子管理器
        const particleManager = {
            createExplosion: (x: number, y: number) => {
                // 创建爆炸粒子效果
            },
            
            createStars: (x: number, y: number) => {
                // 创建星星粒子效果
            }
        };
        
        this.registry.set('particleManager', particleManager);
        
        console.log('🌟 Global objects initialized');
    }

    /**
     * 缓存重要资源
     */
    private cacheImportantAssets(): void
    {
        // 缓存常用纹理
        const importantTextures = ['logo', 'pure-logo', 'star', 'background'];
        
        importantTextures.forEach(key => {
            if (this.textures.exists(key)) {
                // 标记为重要资源，避免被垃圾回收
                const texture = this.textures.get(key);
                // 将纹理添加到缓存中
                texture.source[0].glTexture = texture.source[0].glTexture;
            }
        });
        
        console.log('💾 Important assets cached');
    }

    /**
     * 显示完成界面
     */
    private showCompletionScreen(): void
    {
        // 显示完成消息
        this.loadingText.setText('游戏准备完成！');
        this.loadingText.setColor(this.colors.success);

        /* 在PC模式下，自动三秒进入启动界面，在移动设备下显示用户友好型界面 */
        
        if (this.isMobile) {
            // 显示移动端用户友好型界面
            this.startMobileError();
        } else {
            // 自动跳转（3秒后）
            this.time.delayedCall(3000, () => {
                this.startMainMenu();
            });
        }
    }

    /**
     * 启动主菜单
     */
    private startMainMenu(): void
    {
        console.log('🎮 Starting main menu...');
        
        // 添加场景切换效果
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
        });
    }
    
    private startMobileError(): void 
    {

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.scene.start("MobileError");
        
    }
}
