import { Scene, GameObjects } from 'phaser';
import GameApiService from '../../utils/gameApi';

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
        // 异步获取最新用户信息
        this.loadUserInfoFromServer();
    }

    create() {
        // 创建遮罩层
        this.createOverlay();

        // 创建个人资料弹窗（先创建基础结构）
        this.createProfileModalBase();

        // 设置关闭事件
        this.setupCloseEvents();

        // 如果用户信息已经加载完成，立即显示内容
        if (this.userInfo) {
            this.createUserInfoContent();
            this.createActionButtons();
        }
    }

    /**
     * 从服务器获取最新用户信息
     */
    private async loadUserInfoFromServer(): Promise<void> {
        try {
            console.log('🔄 正在从服务器获取最新用户信息...');

            // 首先尝试从服务器获取最新信息
            const serverUserInfo = await GameApiService.getUserInfo();

            if (serverUserInfo) {
                // 标准化用户信息格式
                this.userInfo = {
                    id: serverUserInfo.id,
                    username: serverUserInfo.username,
                    name: serverUserInfo.name || serverUserInfo.username,
                    email: serverUserInfo.email,
                    avatar: serverUserInfo.avatar,
                    coins: serverUserInfo.coins || 0,
                    maxCoins: serverUserInfo.maxCoins || 0,
                    sduid: serverUserInfo.sduid,
                    createdAt: serverUserInfo.createdAt
                };

                // 更新本地存储
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
                console.log('✅ 用户信息已从服务器更新:', this.userInfo);

                // 如果界面已经创建，重新创建用户信息内容
                if (this.modal) {
                    this.refreshUserInfoDisplay();
                }
            } else {
                throw new Error('服务器返回空数据');
            }
        } catch (error) {
            console.warn('⚠️ 从服务器获取用户信息失败:', error);

            // 检查是否是认证相关的错误
            if (this.isAuthError(error)) {
                console.log('🔐 检测到认证错误，准备跳转登录页面');
                this.handleAuthError();
                return;
            }

            // 如果不是认证错误，回退到本地缓存
            this.loadUserInfoFromCache();
        }
    }

    /**
     * 检查是否是认证相关的错误
     */
    private isAuthError(error: any): boolean {
        // 检查HTTP状态码
        if (error?.response?.status === 401 || error?.response?.status === 302) {
            return true;
        }

        // 检查错误消息
        const errorMessage = error?.message?.toLowerCase() || '';
        const authKeywords = ['unauthorized', 'unauthenticated', 'login', 'auth', '未授权', '登录'];

        return authKeywords.some(keyword => errorMessage.includes(keyword));
    }

    /**
     * 处理认证错误
     */
    private handleAuthError(): void {
        // 关闭当前弹窗
        this.closeProfile();

        // 清除本地认证数据
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('lastLoginTime');

        // 显示提示信息
        console.log('🔄 登录态已失效，即将跳转到登录页面');

        // 延迟跳转，让用户看到提示
        this.time.delayedCall(1000, () => {
            // 跳转到登录场景
            this.scene.get('MainMenu')?.scene.start('Login');
        });
    }

    /**
     * 从本地缓存加载用户信息（回退方案）
     */
    private loadUserInfoFromCache(): void {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                this.userInfo = JSON.parse(userInfoStr);
                console.log('👤 使用本地缓存的用户信息:', this.userInfo);
            } else {
                console.warn('⚠️ 本地也没有用户信息，使用默认信息');
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
            console.error('❌ 加载本地用户信息失败:', error);
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

    private createProfileModalBase(): void {
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

        // 显示加载提示
        const loadingText = this.add.text(0, 0, '正在加载用户信息...', {
            fontSize: '16px',
            color: '#666666',
            fontFamily: '微软雅黑, Arial'
        });
        loadingText.setOrigin(0.5);
        this.modal.add(loadingText);

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

    /**
     * 刷新用户信息显示
     */
    private refreshUserInfoDisplay(): void {
        if (!this.modal) return;

        // 移除旧的用户信息内容（保留背景、标题、关闭按钮）
        const children = this.modal.list.slice(); // 创建副本避免修改时的问题
        children.forEach((child: any) => {
            // 检查是否是关闭按钮（位置在右上角）
            const isCloseButton = child.type === 'Container' && child.x > 200 && child.y < -150;

            // 移除用户信息相关的元素和加载提示，但保留背景、标题、关闭按钮
            if (!isCloseButton && (child.type === 'Container' || (child.type === 'Text' && child.text &&
                (child.text.includes('用户名') || child.text.includes('姓名') ||
                 child.text.includes('邮箱') || child.text.includes('金币') ||
                 child.text.includes('注册时间') || child.text.includes('编辑资料') ||
                 child.text.includes('退出登录') || child.text.includes('正在加载'))))) {
                this.modal?.remove(child);
                child.destroy();
            }
        });

        // 重新创建用户信息内容和操作按钮
        this.createUserInfoContent();
        this.createActionButtons();
    }

    /**
     * 加载并显示头像
     */
    private loadAndDisplayAvatar(avatarContainer: GameObjects.Container): void {
        if (!this.userInfo) return;

        const avatarUrl = this.userInfo.avatar;

        if (avatarUrl && avatarUrl.trim() !== '') {
            // 有头像URL，尝试加载图片
            console.log('🖼️ 正在加载用户头像:', avatarUrl);

            // 创建一个临时的Image对象来测试图片是否能加载
            const img = new Image();
            img.crossOrigin = 'anonymous'; // 处理跨域问题

            img.onload = () => {
                console.log('✅ 头像加载成功');

                // 创建一个唯一的纹理键名
                const textureKey = `user-avatar-${this.userInfo?.id || 'default'}`;

                // 如果纹理已存在，先销毁它
                if (this.textures.exists(textureKey)) {
                    this.textures.remove(textureKey);
                }

                // 将图片添加为纹理
                this.textures.addImage(textureKey, img);

                // 创建头像图片对象
                const avatarImage = this.add.image(0, 0, textureKey);
                avatarImage.setDisplaySize(76, 76); // 设置显示尺寸为圆形背景的大小
                avatarImage.setOrigin(0.5);

                // 创建圆形遮罩
                const mask = this.add.graphics();
                mask.fillStyle(0xffffff);
                mask.fillCircle(0, 0, 38); // 稍小于背景圆形

                // 应用遮罩使头像变成圆形
                const maskShape = mask.createGeometryMask();
                avatarImage.setMask(maskShape);

                // 将头像和遮罩添加到容器
                avatarContainer.add([avatarImage, mask]);
            };

            img.onerror = () => {
                console.warn('⚠️ 头像加载失败，使用默认头像');
                this.createDefaultAvatar(avatarContainer);
            };

            // 开始加载图片
            img.src = avatarUrl;
        } else {
            // 没有头像URL，使用默认头像
            console.log('📝 使用默认头像（用户名首字母）');
            this.createDefaultAvatar(avatarContainer);
        }
    }

    /**
     * 创建默认头像（用户名首字母）
     */
    private createDefaultAvatar(avatarContainer: GameObjects.Container): void {
        const avatarText = this.add.text(0, 0, this.userInfo?.username?.charAt(0).toUpperCase() || '用', {
            fontSize: '32px',
            color: '#4a90e2',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        avatarText.setOrigin(0.5);
        avatarContainer.add(avatarText);
    }

    private createUserInfoContent(): void {
        if (!this.userInfo) return;

        // 调整内容Y坐标，增加与标题的距离
        const contentY = -40;

        // 头像区域
        const avatarContainer = this.add.container(-150, contentY);

        // 头像背景
        const avatarBg = this.add.graphics();
        avatarBg.fillStyle(0xe3f2fd, 1);
        avatarBg.lineStyle(2, 0x4a90e2);
        avatarBg.fillCircle(0, 0, 40);
        avatarBg.strokeCircle(0, 0, 40);
        avatarContainer.add(avatarBg);

        // 尝试加载头像图片
        this.loadAndDisplayAvatar(avatarContainer);

        this.modal?.add(avatarContainer);

        // 用户信息文本
        const infoContainer = this.add.container(50, contentY - 60);

        // 移除学号信息，只显示其他信息
        const infoItems = [
            { label: '用户名', value: this.userInfo.username || '未设置' },
            { label: '姓名', value: this.userInfo.name || '未设置' },
            { label: '邮箱', value: this.userInfo.email || '未设置' },
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
            const timeText = this.add.text(0, 100, `注册时间: ${createTime}`, {
                fontSize: '14px',
                color: '#999999',
                fontFamily: '微软雅黑, Arial'
            });
            timeText.setOrigin(0.5);
            this.modal?.add(timeText);
        }
    }

    private createActionButtons(): void {
        const buttonY = 130;
        
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
