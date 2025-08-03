import { Scene } from 'phaser';
import { GameStats, PlayerData, SavedSettings, SavedProgress } from '../types/Boot';

export class Boot extends Scene
{
    private gameVersion: string = '1.0.0';
    private debugMode: boolean = false;

    constructor ()
    {
        super('Boot');
    }

    init ()
    {
        console.log('🚀 Boot scene starting...');
        
        // 系统检查和全局配置
        this.checkSystemCapabilities();
        this.initializeGameSettings();
        this.setupGlobalEventListeners();
    }

    preload ()
    {
        // 创建简单的启动界面
        this.createSimpleBootUI();
        
        // 设置资源路径
        this.load.setPath('assets/');
        
        // 只加载Preloader场景需要的最基础资源
        this.load.image('background', 'bg.png');
        this.load.image('loading-bg', 'bg.png'); // 备用背景
        this.load.image('logo', 'logo.png'); // 加载logo图片
        this.load.image('pure-logo', 'pure-logo.png'); // 加载pure-logo图片
        
        this.load.on('complete', () => {
            console.log('✅ Boot assets loaded');
            this.displayLogo(); // 加载完成后显示logo
        });
        
        this.load.on('loaderror', (file: any) => {
            console.error('❌ Failed to load boot asset:', file.key);
        });
    }

    create ()
    {
        console.log(`🎬 Game Boot Complete - Version ${this.gameVersion}`);
        
        // 设置全局游戏数据
        this.setupGameData();
        
        // 检查本地存储
        this.checkLocalStorage();
        
        // 初始化音频系统
        this.initializeAudio();
        
        // 短暂延迟后启动Preloader场景
        this.time.delayedCall(2400, () => {
            this.startPreloader();
        });
    }

    /**
     * 创建简单的启动界面
     */
    private createSimpleBootUI(): void
    {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // 创建简单背景
        this.add.rectangle(centerX, centerY, 1280, 720, 0x000000);
        
        // 创建版权信息
        this.add.text(centerX, 700, '© 2024 学线模拟经营游戏', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);
        
        // 添加启动提示
        this.add.text(centerX, 730, '正在初始化游戏系统...', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);
    }

    /**
     * 显示logo图片
     */
    private displayLogo(): void
    {
        const centerX = this.cameras.main.centerX;
        const centerY =     this.cameras.main.centerY;
        
        // 创建logo图片
        const logo = this.add.image(centerX, centerY, 'logo');
        
        // 设置logo大小
        logo.setScale(0.5); 
        
        // 添加logo出现动画
        logo.setAlpha(0);
        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 1200,
            ease: 'Power2'
        });
        
        
        console.log('🎨 Logo displayed successfully');
    }

    /**
     * 检查系统能力
     */
    private checkSystemCapabilities(): void
    {
        // 检查WebGL支持
        if (this.sys.game.renderer.type !== Phaser.WEBGL) {
            console.warn('⚠️  WebGL not supported, using Canvas renderer');
        }

        // 检查音频支持
        if (!this.sys.game.device.audio) {
            console.warn('⚠️  Audio not supported');
        }

        // 检查本地存储支持
        try {
            if (typeof Storage === 'undefined') {
                console.warn('⚠️  LocalStorage not supported');
            }
        } catch (e) {
            console.warn('⚠️  LocalStorage not supported');
        }

        // 检查触摸支持
        if (this.sys.game.device.input && this.sys.game.device.input.touch) {
            console.log('📱 Touch device detected');
        }
    }

    /**
     * 初始化游戏设置
     */
    private initializeGameSettings(): void
    {
        // 设置调试模式
        this.debugMode = false; // 可以从URL参数或本地存储读取
        
        // 设置游戏版本
        this.registry.set('gameVersion', this.gameVersion);
        this.registry.set('debugMode', this.debugMode);
        
        // 设置默认音量
        this.registry.set('masterVolume', 0.8);
        this.registry.set('musicVolume', 0.7);
        this.registry.set('sfxVolume', 0.9);
        
        // 设置游戏难度等级
        this.registry.set('difficulty', 'normal' as const);
        
        // 设置语言
        this.registry.set('language', 'zh-CN' as const);
        
        console.log('⚙️  Game settings initialized');
    }

    /**
     * 设置全局事件监听
     */
    private setupGlobalEventListeners(): void
    {
        // 监听窗口失焦/获焦
        this.sys.game.events.on('blur', () => {
            console.log('🔇 Game lost focus');
            this.sys.game.sound.pauseAll();
        });

        this.sys.game.events.on('focus', () => {
            console.log('🔊 Game regained focus');
            this.sys.game.sound.resumeAll();
        });

        // 监听窗口大小变化
        this.scale.on('resize', this.onResize, this);
    }

    /**
     * 设置游戏数据
     */
    private setupGameData(): void
    {
        // 初始化游戏统计数据
        const gameStats: GameStats = {
            totalPlayTime: 0,
            totalStudents: 0,
            totalRevenue: 0,
            gamesPlayed: 0,
            bestScore: 0
        };
        this.registry.set('gameStats', gameStats);
        
        // 初始化玩家数据
        const playerData: PlayerData = {
            name: 'Player',
            level: 1,
            experience: 0,
            achievements: []
        };
        this.registry.set('playerData', playerData);
        
        console.log('📊 Game data initialized');
    }

    /**
     * 检查本地存储
     */
    private checkLocalStorage(): void
    {
        try {
            // 检查并加载保存的设置
            const savedSettings = localStorage.getItem('gameSettings');
            if (savedSettings) {
                const settings: SavedSettings = JSON.parse(savedSettings);
                this.registry.set('masterVolume', settings.masterVolume || 0.8);
                this.registry.set('musicVolume', settings.musicVolume || 0.7);
                this.registry.set('sfxVolume', settings.sfxVolume || 0.9);
                console.log('💾 Saved settings loaded');
            }
            
            // 检查并加载游戏进度
            const savedProgress = localStorage.getItem('gameProgress');
            if (savedProgress) {
                const progress: SavedProgress = JSON.parse(savedProgress);
                this.registry.set('gameStats', progress.stats || {});
                this.registry.set('playerData', progress.player || {});
                console.log('💾 Game progress loaded');
            }
        } catch (error) {
            console.warn('⚠️  Failed to load saved data:', error);
        }
    }

    /**
     * 初始化音频系统
     */
    private initializeAudio(): void
    {
        if (this.sys.game.device.audio) {
            // 设置音频音量
            this.sound.volume = this.registry.get('masterVolume') || 0.8;
            console.log('🔊 Audio system initialized');
        }
    }

    /**
     * 窗口大小变化处理
     */
    private onResize(): void
    {
        console.log('📱 Window resized:', this.scale.width, 'x', this.scale.height);
        // 这里可以添加响应式布局逻辑
    }

    /**
     * 启动Preloader场景
     */
    private startPreloader(): void
    {
        console.log('🎬 Starting Preloader scene...');
        
        // 添加简单的场景切换效果
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Preloader');
        });
    }
}
