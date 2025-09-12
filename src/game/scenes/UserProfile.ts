import { Scene, GameObjects } from 'phaser';

interface UserInfo {
    id: number;
    username: string;
    name?: string;
    email?: string;
    avatar?: string;
    coins?: number;
    maxCoins?: number;
    sduid?: string;
    createdAt?: string;
}

export class UserProfile extends Scene {
    private modal: GameObjects.Container | null = null;
    private overlay: GameObjects.Graphics | null = null;
    private userInfo: UserInfo | null = null;

    constructor() {
        super('UserProfile');
    }

    init(data?: { parentScene?: string }) {
        // 获取用户信息
        this.loadUserInfo();
    }

    create() {
        // 创建遮罩层
        this.createOverlay();
        
        // 创建个人资料弹窗
        this.createProfileModal();
        
        // 设置关闭事件
        this.setupCloseEvents();
    }

    private loadUserInfo(): void {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                this.userInfo = JSON.parse(userInfoStr);
                console.log('👤 User info loaded:', this.userInfo);
            } else {
                console.warn('⚠️ No user info found in localStorage');
                // 使用默认信息
                this.userInfo = {
                    id: 0,
                    username: '游客',
                    name: '游客用户',
                    email: '',
                    coins: 0,
                    maxCoins: 0
                };
            }
        } catch (error) {
            console.error('❌ Failed to load user info:', error);
            this.userInfo = null;
        }
    }

    private createOverlay(): void {
        this.overlay = this.add.graphics();
        this.overlay.fillStyle(0x000000, 0.7);
        this.overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.overlay.setDepth(100);
        this.overlay.setInteractive();
        
        // 点击遮罩层关闭弹窗
        this.overlay.on('pointerdown', () => {
            this.closeProfile();
        });
    }

    private createProfileModal(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // 创建主容器
        this.modal = this.add.container(centerX, centerY);
        this.modal.setDepth(101);

        // 创建背景
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0xffffff, 1);
        modalBg.lineStyle(3, 0x4a90e2);
        modalBg.fillRoundedRect(-250, -200, 500, 400, 15);
        modalBg.strokeRoundedRect(-250, -200, 500, 400, 15);
        this.modal.add(modalBg);

        // 创建标题
        const title = this.add.text(0, -160, '个人资料', {
            fontSize: '28px',
            color: '#333333',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        this.modal.add(title);

        // 创建关闭按钮
        this.createCloseButton();

        // 创建用户信息内容
        this.createUserInfoContent();

        // 创建操作按钮
        this.createActionButtons();

        // 添加入场动画
        this.modal.setScale(0);
        this.tweens.add({
            targets: this.modal,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    private createCloseButton(): void {
        const closeButton = this.add.container(220, -170);
        
        const closeBg = this.add.graphics();
        closeBg.fillStyle(0xff6b6b, 1);
        closeBg.fillCircle(0, 0, 15);
        
        const closeText = this.add.text(0, 0, '×', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        closeText.setOrigin(0.5);
        
        closeButton.add([closeBg, closeText]);
        closeButton.setInteractive(new Phaser.Geom.Circle(0, 0, 15), Phaser.Geom.Circle.Contains);
        closeButton.on('pointerdown', () => {
            this.closeProfile();
        });
        
        // 悬停效果
        closeButton.on('pointerover', () => {
            closeBg.clear();
            closeBg.fillStyle(0xff5252, 1);
            closeBg.fillCircle(0, 0, 15);
        });
        
        closeButton.on('pointerout', () => {
            closeBg.clear();
            closeBg.fillStyle(0xff6b6b, 1);
            closeBg.fillCircle(0, 0, 15);
        });
        
        this.modal?.add(closeButton);
    }

    private createUserInfoContent(): void {
        if (!this.userInfo) return;

        const contentY = -80;
        
        // 头像区域
        const avatarContainer = this.add.container(-150, contentY);
        
        // 头像背景
        const avatarBg = this.add.graphics();
        avatarBg.fillStyle(0xe3f2fd, 1);
        avatarBg.lineStyle(2, 0x4a90e2);
        avatarBg.fillCircle(0, 0, 40);
        avatarBg.strokeCircle(0, 0, 40);
        avatarContainer.add(avatarBg);
        
        // 头像文字（如果没有头像图片）
        const avatarText = this.add.text(0, 0, this.userInfo.username?.charAt(0).toUpperCase() || '用', {
            fontSize: '32px',
            color: '#4a90e2',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        avatarText.setOrigin(0.5);
        avatarContainer.add(avatarText);
        
        this.modal?.add(avatarContainer);

        // 用户信息文本
        const infoContainer = this.add.container(50, contentY - 60);
        
        const infoItems = [
            { label: '用户名', value: this.userInfo.username || '未设置' },
            { label: '姓名', value: this.userInfo.name || '未设置' },
            { label: '邮箱', value: this.userInfo.email || '未设置' },
            { label: '学号', value: this.userInfo.sduid || '未设置' },
            { label: '金币', value: `${this.userInfo.coins || 0}` },
            { label: '最大金币', value: `${this.userInfo.maxCoins || 0}` }
        ];

        infoItems.forEach((item, index) => {
            const y = index * 25;
            
            // 标签
            const label = this.add.text(-100, y, item.label + ':', {
                fontSize: '16px',
                color: '#666666',
                fontFamily: '微软雅黑, Arial'
            });
            label.setOrigin(0, 0.5);
            infoContainer.add(label);
            
            // 值
            const value = this.add.text(-20, y, item.value, {
                fontSize: '16px',
                color: '#333333',
                fontFamily: '微软雅黑, Arial',
                fontStyle: item.label === '金币' || item.label === '最大金币' ? 'bold' : 'normal'
            });
            value.setOrigin(0, 0.5);
            infoContainer.add(value);
        });
        
        this.modal?.add(infoContainer);

        // 注册时间（如果有）
        if (this.userInfo.createdAt) {
            const createTime = new Date(this.userInfo.createdAt).toLocaleDateString('zh-CN');
            const timeText = this.add.text(0, 120, `注册时间: ${createTime}`, {
                fontSize: '14px',
                color: '#999999',
                fontFamily: '微软雅黑, Arial'
            });
            timeText.setOrigin(0.5);
            this.modal?.add(timeText);
        }
    }

    private createActionButtons(): void {
        const buttonY = 150;
        
        // 编辑资料按钮
        const editButton = this.add.container(-80, buttonY);
        const editBg = this.add.graphics();
        editBg.fillStyle(0x4a90e2, 1);
        editBg.fillRoundedRect(-50, -15, 100, 30, 15);
        
        const editText = this.add.text(0, 0, '编辑资料', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: '微软雅黑, Arial'
        });
        editText.setOrigin(0.5);
        
        editButton.add([editBg, editText]);
        editButton.setInteractive(new Phaser.Geom.Rectangle(-50, -15, 100, 30), Phaser.Geom.Rectangle.Contains);
        editButton.on('pointerdown', () => {
            console.log('📝 编辑资料功能待实现');
            // TODO: 实现编辑资料功能
        });
        
        // 悬停效果
        editButton.on('pointerover', () => {
            editBg.clear();
            editBg.fillStyle(0x3d7bd6, 1);
            editBg.fillRoundedRect(-50, -15, 100, 30, 15);
        });
        
        editButton.on('pointerout', () => {
            editBg.clear();
            editBg.fillStyle(0x4a90e2, 1);
            editBg.fillRoundedRect(-50, -15, 100, 30, 15);
        });
        
        this.modal?.add(editButton);

        // 退出登录按钮
        const logoutButton = this.add.container(80, buttonY);
        const logoutBg = this.add.graphics();
        logoutBg.fillStyle(0xff6b6b, 1);
        logoutBg.fillRoundedRect(-50, -15, 100, 30, 15);
        
        const logoutText = this.add.text(0, 0, '退出登录', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: '微软雅黑, Arial'
        });
        logoutText.setOrigin(0.5);
        
        logoutButton.add([logoutBg, logoutText]);
        logoutButton.setInteractive(new Phaser.Geom.Rectangle(-50, -15, 100, 30), Phaser.Geom.Rectangle.Contains);
        logoutButton.on('pointerdown', () => {
            this.handleLogout();
        });
        
        // 悬停效果
        logoutButton.on('pointerover', () => {
            logoutBg.clear();
            logoutBg.fillStyle(0xff5252, 1);
            logoutBg.fillRoundedRect(-50, -15, 100, 30, 15);
        });
        
        logoutButton.on('pointerout', () => {
            logoutBg.clear();
            logoutBg.fillStyle(0xff6b6b, 1);
            logoutBg.fillRoundedRect(-50, -15, 100, 30, 15);
        });
        
        this.modal?.add(logoutButton);
    }

    private setupCloseEvents(): void {
        // ESC键关闭
        this.input.keyboard?.on('keydown-ESC', () => {
            this.closeProfile();
        });
    }

    private closeProfile(): void {
        if (this.modal) {
            // 退出动画
            this.tweens.add({
                targets: this.modal,
                scaleX: 0,
                scaleY: 0,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    this.scene.stop();
                }
            });
        } else {
            this.scene.stop();
        }
    }

    private handleLogout(): void {
        console.log('🚪 用户退出登录');
        
        // 清理用户数据
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('lastLoginTime');
        
        // 关闭弹窗
        this.closeProfile();
        
        // 跳转到登录场景
        this.scene.get('MainMenu')?.scene.start('Login');
    }
}
