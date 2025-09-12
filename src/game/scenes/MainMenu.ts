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
    
    // 排行榜按钮
    rankButton: GameObjects.Image;
    
    // 排行榜界面容器
    rankModal: GameObjects.Container | null = null;

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
        // 创建排行榜按钮
        this.createRankButton();
        // 设置音频
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
            this.showUserProfile();
        });
    }

    /**
     * 显示用户资料
     */
    private showUserProfile(): void {
        console.log('👤 显示用户资料');

        // 检查用户是否已登录
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            console.log('⚠️ 用户未登录，跳转到登录页面');
            this.scene.start('Login');
            return;
        }

        // 启动用户资料场景（作为弹窗）
        this.scene.launch('UserProfile', { parentScene: 'MainMenu' });
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
     * 创建排行榜按钮
     */
    private createRankButton(): void {
        // 创建排行榜按钮，位置在设置按钮左侧
        this.rankButton = this.add.image(this.cameras.main.width - 110, 40, 'rank_icon');
        this.rankButton.setOrigin(0.5);
        this.rankButton.setScale(0.33);
        this.rankButton.setDepth(20);
        this.rankButton.setInteractive({ useHandCursor: true });

        // 创建气泡提示
        const bubblePadding = 10;
        const bubbleText = this.add.text(0, 0, '排行榜', {
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
        this.rankButton.on('pointerover', () => {
            // 计算气泡位置
            const x = this.rankButton.x;
            const y = this.rankButton.y + this.rankButton.displayHeight / 2 + 20;
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
        this.rankButton.on('pointerout', () => {
            bubbleText.setVisible(false);
            bubbleBg.setVisible(false);
        });
        
        // 点击事件
        this.rankButton.on('pointerdown', () => {
            console.log('🏆 排行榜按钮被点击');
            this.showRankModal();
        });
    }

    /**
     * 显示排行榜界面
     */
    private showRankModal(): void {
        if (this.rankModal) {
            return; // 如果已经显示，则不重复创建
        }

        // 创建排行榜容器
        this.rankModal = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.rankModal.setDepth(100);

        // 创建半透明遮罩
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(-this.cameras.main.width / 2, -this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height);
        overlay.setInteractive();
        this.rankModal.add(overlay);

        // 创建排行榜背景
        const rankBg = this.add.image(0, 0, 'rank_bg');
        rankBg.setOrigin(0.5);
        rankBg.setScale(0.9);
        this.rankModal.add(rankBg);
        // 创建排行榜内容区域
        const contentArea = this.add.graphics();
        contentArea.fillStyle(0xFFFFF8, 0.95);
        contentArea.lineStyle(4, 0x8B4513, 1);
        contentArea.fillRoundedRect(-200, -140, 400, 280, 20);
        contentArea.strokeRoundedRect(-200, -140, 400, 280, 20);
        this.rankModal.add(contentArea);

        // 添加表头
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x8B4513, 0.1);
        headerBg.fillRoundedRect(-180, -130, 360, 35, 10);
        this.rankModal.add(headerBg);
        
        const headerRank = this.add.text(-150, -112, '排名', {
            fontSize: '18px',
            color: '#8B4513',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        headerRank.setOrigin(0.5);
        this.rankModal?.add(headerRank);
        
        const headerName = this.add.text(0, -112, '玩家名称', {
            fontSize: '18px',
            color: '#8B4513',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        headerName.setOrigin(0.5);
        this.rankModal?.add(headerName);
        
        const headerScore = this.add.text(150, -112, '分数', {
            fontSize: '18px',
            color: '#8B4513',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        headerScore.setOrigin(0.5);
        this.rankModal?.add(headerScore);

        // 添加排行榜数据（暂时使用模拟数据）
        const rankData = [
            { rank: 1, name: '学线大神', score: 99999 },
            { rank: 2, name: '代码高手', score: 88888 },
            { rank: 3, name: '项目达人', score: 77777 },
            { rank: 4, name: '开发新星', score: 66666 },
            { rank: 5, name: '编程爱好者', score: 55555 }
        ];

        rankData.forEach((data, index) => {
            const y = -70 + index * 45;
            const isTopThree = index < 3;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const rankColor = isTopThree ? rankColors[index] : '#666666';
            
            // 为前三名添加背景高亮
              if (isTopThree) {
                  const rowBg = this.add.graphics();
                  const bgColor = index === 0 ? 0xFFD700 : index === 1 ? 0xC0C0C0 : 0xCD7F32;
                  rowBg.fillStyle(bgColor, 0.1);
                  rowBg.fillRoundedRect(-180, y - 18, 360, 36, 8);
                  this.rankModal?.add(rowBg);
              }
            
            // 排名图标
            let rankIcon = '';
            if (index === 0) rankIcon = '🥇';
            else if (index === 1) rankIcon = '🥈';
            else if (index === 2) rankIcon = '🥉';
            
            const rankText = this.add.text(-150, y, rankIcon ? `${rankIcon}` : `${data.rank}`, {
                 fontSize: rankIcon ? '28px' : '24px',
                 color: rankColor,
                 fontFamily: '微软雅黑, Arial',
                 fontStyle: 'bold'
             });
             rankText.setOrigin(0.5);
             this.rankModal?.add(rankText);
             
             // 玩家名称
             const nameText = this.add.text(0, y, data.name, {
                 fontSize: '20px',
                 color: isTopThree ? '#2C3E50' : '#34495E',
                 fontFamily: '微软雅黑, Arial',
                 fontStyle: isTopThree ? 'bold' : 'normal'
             });
             nameText.setOrigin(0.5);
             this.rankModal?.add(nameText);
             
             // 分数
             const scoreText = this.add.text(150, y, `${data.score.toLocaleString()}`, {
                 fontSize: '20px',
                 color: '#E74C3C',
                 fontFamily: '微软雅黑, Arial',
                 fontStyle: 'bold'
             });
             scoreText.setOrigin(0.5);
             this.rankModal?.add(scoreText);
            
            // 为前三名添加闪烁效果
            if (isTopThree) {
                this.tweens.add({
                    targets: [rankText, nameText, scoreText],
                    alpha: 0.7,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // 创建关闭按钮
        const closeButtonBg = this.add.graphics();
        closeButtonBg.fillStyle(0xFF4757, 0.9);
        closeButtonBg.fillCircle(240, -160, 20);
        closeButtonBg.lineStyle(2, 0xFFFFFF, 1);
        closeButtonBg.strokeCircle(240, -160, 20);
        this.rankModal.add(closeButtonBg);
        
        const closeButton = this.add.text(240, -160, '✕', {
            fontSize: '24px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        
        // 关闭按钮悬停效果
        closeButton.on('pointerover', () => {
            closeButtonBg.clear();
            closeButtonBg.fillStyle(0xFF3742, 1);
            closeButtonBg.fillCircle(240, -160, 22);
            closeButtonBg.lineStyle(2, 0xFFFFFF, 1);
            closeButtonBg.strokeCircle(240, -160, 22);
        });
        
        closeButton.on('pointerout', () => {
            closeButtonBg.clear();
            closeButtonBg.fillStyle(0xFF4757, 0.9);
            closeButtonBg.fillCircle(240, -160, 20);
            closeButtonBg.lineStyle(2, 0xFFFFFF, 1);
            closeButtonBg.strokeCircle(240, -160, 20);
        });
        
        closeButton.on('pointerdown', () => {
            this.hideRankModal();
        });
        this.rankModal?.add(closeButton);

        // 点击遮罩关闭
        overlay.on('pointerdown', () => {
            this.hideRankModal();
        });

        // 添加弹出动画
        this.rankModal.setAlpha(0);
        this.rankModal.setScale(0.8);
        this.tweens.add({
            targets: this.rankModal,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    /**
     * 隐藏排行榜界面
     */
    private hideRankModal(): void {
        if (!this.rankModal) {
            return;
        }

        // 添加淡出动画
        this.tweens.add({
            targets: this.rankModal,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                if (this.rankModal) {
                    this.rankModal.destroy();
                    this.rankModal = null;
                }
            }
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
        
        // 清理排行榜界面
        if (this.rankModal) {
            this.rankModal.destroy();
            this.rankModal = null;
        }
    }
}