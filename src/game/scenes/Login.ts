import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';

/**
 * 登录场景类
 * 处理用户登录验证和界面交互
 */
export class Login extends Scene {
    // UI元素
    private background: GameObjects.Image;
    private loginModal: GameObjects.Container | null = null;
    private usernameInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private loginButton: GameObjects.Image;
    private guestButton: GameObjects.Image;
    private registerButton: GameObjects.Image;
    private loadingText: GameObjects.Text | null = null;
    
    // 状态管理
    private isLoading: boolean = false;
    private loginAttempts: number = 0;
    private maxLoginAttempts: number = 3;

    constructor() {
        super('Login');
    }

    /**
     * 场景创建方法
     */
    create(): void {
        console.log('🔐 Login scene started');
        
        // 创建背景
        this.createBackground();
        
        // 创建登录界面
        this.createLoginUI();
        
        // 设置键盘事件
        this.setupKeyboardEvents();
        
        // 通知场景已准备好
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        // 使用主菜单相同的背景
        this.background = this.add.image(640, 360, 'background');
        this.background.setDisplaySize(1280, 720);
        
        // 添加半透明遮罩
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, 1280, 720);
    }

    /**
     * 创建登录界面UI
     */
    private createLoginUI(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // 创建登录容器
        this.loginModal = this.add.container(centerX, centerY);

        // 创建登录背景框（增加高度以容纳第三方登录按钮）
        const loginBg = this.add.graphics();
        loginBg.fillStyle(0xffffff, 0.95);
        loginBg.lineStyle(3, 0x4a90e2);
        loginBg.fillRoundedRect(-200, -180, 400, 420, 15);
        loginBg.strokeRoundedRect(-200, -180, 400, 420, 15);
        this.loginModal.add(loginBg);

        // 添加装饰性标题背景
        const titleBg = this.add.graphics();
        titleBg.fillStyle(0x4a90e2, 0.1);
        titleBg.fillRoundedRect(-180, -160, 360, 60, 10);
        this.loginModal.add(titleBg);

        // 创建标题
        const title = this.add.text(0, -130, '学线模拟经营', {
            fontSize: '28px',
            color: '#2c3e50',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        this.loginModal.add(title);

        // 创建副标题
        const subtitle = this.add.text(0, -100, '请登录您的账户', {
            fontSize: '16px',
            color: '#7f8c8d',
            fontFamily: '微软雅黑, Arial'
        });
        subtitle.setOrigin(0.5);
        this.loginModal.add(subtitle);

        // 创建输入框标签和输入框
        this.createInputFields();

        // 创建按钮
        this.createButtons();

        // 创建第三方登录按钮
        this.createThirdPartyLoginButton();

        // 创建底部链接
        this.createBottomLinks();

        // 添加弹出动画
        this.loginModal.setScale(0.8);
        this.loginModal.setAlpha(0);
        this.tweens.add({
            targets: this.loginModal,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    /**
     * 创建输入框
     */
    private createInputFields(): void {
        // 用户名标签
        const usernameLabel = this.add.text(-150, -40, '用户名:', {
            fontSize: '16px',
            color: '#34495e',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        usernameLabel.setOrigin(0, 0.5);
        this.loginModal?.add(usernameLabel);

        // 用户名输入框背景
        const usernameBg = this.add.graphics();
        usernameBg.fillStyle(0xf8f9fa);
        usernameBg.lineStyle(2, 0xdee2e6);
        usernameBg.fillRoundedRect(-150, -20, 300, 40, 5);
        usernameBg.strokeRoundedRect(-150, -20, 300, 40, 5);
        this.loginModal?.add(usernameBg);

        // 密码标签
        const passwordLabel = this.add.text(-150, 34, '密码:', {
            fontSize: '16px',
            color: '#34495e',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        passwordLabel.setOrigin(0, 0.5);
        this.loginModal?.add(passwordLabel);

        // 密码输入框背景
        const passwordBg = this.add.graphics();
        passwordBg.fillStyle(0xf8f9fa);
        passwordBg.lineStyle(2, 0xdee2e6);
        passwordBg.fillRoundedRect(-150, 50, 300, 40, 5);
        passwordBg.strokeRoundedRect(-150, 50, 300, 40, 5);
        this.loginModal?.add(passwordBg);

        // 创建HTML输入框
        this.createHTMLInputs();
    }

    /**
     * 创建HTML输入框
     */
    private createHTMLInputs(): void {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        // 计算输入框在页面中的位置
        const rect = gameContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 创建用户名输入框
        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        this.usernameInput.style.position = 'absolute';
        this.usernameInput.style.left = `${centerX - 140}px`;
        this.usernameInput.style.top = `${centerY -18}px`;
        this.usernameInput.style.width = '280px';
        this.usernameInput.style.height = '30px';
        this.usernameInput.style.border = 'none';
        this.usernameInput.style.outline = 'none';
        this.usernameInput.style.backgroundColor = 'transparent';
        this.usernameInput.style.fontSize = '16px';
        this.usernameInput.style.fontFamily = '微软雅黑, Arial';
        this.usernameInput.style.padding = '5px 10px';
        this.usernameInput.style.color = '#000000';
        this.usernameInput.style.zIndex = '1000';
        document.body.appendChild(this.usernameInput);

        // 创建密码输入框
        this.passwordInput = document.createElement('input');
        this.passwordInput.type = 'password';
        this.passwordInput.style.position = 'absolute';
        this.passwordInput.style.left = `${centerX - 140}px`;
        this.passwordInput.style.top = `${centerY + 52}px`;
        this.passwordInput.style.width = '280px';
        this.passwordInput.style.height = '30px';
        this.passwordInput.style.border = 'none';
        this.passwordInput.style.outline = 'none';
        this.passwordInput.style.backgroundColor = 'transparent';
        this.passwordInput.style.fontSize = '16px';
        this.passwordInput.style.fontFamily = '微软雅黑, Arial';
        this.passwordInput.style.padding = '5px 10px';
        this.passwordInput.style.color = '#000000';
        this.passwordInput.style.zIndex = '1000';
        document.body.appendChild(this.passwordInput);

        // 聚焦到用户名输入框
        this.usernameInput.focus();
    }

    /**
     * 创建按钮
     */
    private createButtons(): void {
        // 登录按钮
        const loginBtnBg = this.add.graphics();
        loginBtnBg.fillStyle(0x4a90e2);
        loginBtnBg.fillRoundedRect(-80, 110, 160, 45, 8);
        loginBtnBg.setInteractive(new Phaser.Geom.Rectangle(-80, 110, 160, 45), Phaser.Geom.Rectangle.Contains);
        this.loginModal?.add(loginBtnBg);

        const loginBtnText = this.add.text(0, 132, '登录', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        loginBtnText.setOrigin(0.5);
        this.loginModal?.add(loginBtnText);

        // 登录按钮交互
        loginBtnBg.on('pointerdown', () => this.handleLogin());
        loginBtnBg.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            loginBtnBg.clear();
            loginBtnBg.fillStyle(0x357abd);
            loginBtnBg.fillRoundedRect(-80, 110, 160, 45, 8);
        });
        loginBtnBg.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            loginBtnBg.clear();
            loginBtnBg.fillStyle(0x4a90e2);
            loginBtnBg.fillRoundedRect(-80, 110, 160, 45, 8);
        });
    }

    /**
     * 创建第三方登录按钮
     */
    private createThirdPartyLoginButton(): void {
        // 第三方登录按钮背景
        const thirdPartyBtnBg = this.add.graphics();
        thirdPartyBtnBg.fillStyle(0x28a745);
        thirdPartyBtnBg.fillRoundedRect(-80, 165, 160, 40, 8);
        thirdPartyBtnBg.setInteractive(new Phaser.Geom.Rectangle(-80, 165, 160, 40), Phaser.Geom.Rectangle.Contains);
        this.loginModal?.add(thirdPartyBtnBg);

        const thirdPartyBtnText = this.add.text(0, 185, '第三方登录', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold'
        });
        thirdPartyBtnText.setOrigin(0.5);
        this.loginModal?.add(thirdPartyBtnText);

        // 第三方登录按钮交互
        thirdPartyBtnBg.on('pointerdown', () => this.handleThirdPartyLogin());
        thirdPartyBtnBg.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            thirdPartyBtnBg.clear();
            thirdPartyBtnBg.fillStyle(0x218838);
            thirdPartyBtnBg.fillRoundedRect(-80, 165, 160, 40, 8);
        });
        thirdPartyBtnBg.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            thirdPartyBtnBg.clear();
            thirdPartyBtnBg.fillStyle(0x28a745);
            thirdPartyBtnBg.fillRoundedRect(-80, 165, 160, 40, 8);
        });
    }

    /**
     * 创建底部链接
     */
    private createBottomLinks(): void {
        // 游客登录链接
        const guestLink = this.add.text(-60, 220, '游客登录', {
            fontSize: '14px',
            color: '#4a90e2',
            fontFamily: '微软雅黑, Arial'
        });
        guestLink.setOrigin(0.5);
        guestLink.setInteractive();
        guestLink.on('pointerdown', () => this.handleGuestLogin());
        guestLink.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            guestLink.setStyle({ color: '#357abd' });
        });
        guestLink.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            guestLink.setStyle({ color: '#4a90e2' });
        });
        this.loginModal?.add(guestLink);

        // 注册链接
        const registerLink = this.add.text(60, 220, '注册账户', {
            fontSize: '14px',
            color: '#4a90e2',
            fontFamily: '微软雅黑, Arial'
        });
        registerLink.setOrigin(0.5);
        registerLink.setInteractive();
        registerLink.on('pointerdown', () => this.handleRegister());
        registerLink.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            registerLink.setStyle({ color: '#357abd' });
        });
        registerLink.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            registerLink.setStyle({ color: '#4a90e2' });
        });
        this.loginModal?.add(registerLink);
    }

    /**
     * 设置键盘事件
     */
    private setupKeyboardEvents(): void {
        // 监听回车键登录
        this.input.keyboard?.on('keydown-ENTER', () => {
            if (!this.isLoading) {
                this.handleLogin();
            }
        });

        // 监听ESC键关闭（可选，如果需要返回功能）
        this.input.keyboard?.on('keydown-ESC', () => {
            // 可以添加返回Preloader的逻辑
        });
    }

    /**
     * 处理登录逻辑
     */
    private async handleLogin(): Promise<void> {
        if (this.isLoading) return;

        const username = this.usernameInput?.value.trim();
        const password = this.passwordInput?.value.trim();

        // 验证输入
        if (!username || !password) {
            this.showMessage('请输入用户名和密码', 'error');
            return;
        }

        if (this.loginAttempts >= this.maxLoginAttempts) {
            this.showMessage('登录尝试次数过多，请稍后再试', 'error');
            return;
        }

        this.isLoading = true;
        this.showLoadingState(true);

        try {
            // 模拟登录API调用
            const loginResult = await this.simulateLoginAPI(username, password);
            
            if (loginResult.success) {
                // 保存登录状态
                localStorage.setItem('userToken', loginResult.token);
                localStorage.setItem('username', username);
                
                this.showMessage('登录成功！', 'success');
                
                // 延迟跳转到主菜单
                this.time.delayedCall(1000, () => {
                    this.goToMainMenu();
                });
            } else {
                this.loginAttempts++;
                this.showMessage(loginResult.message || '登录失败，请检查用户名和密码', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);
        }
    }

    /**
     * 模拟登录API
     */
    private async simulateLoginAPI(username: string, password: string): Promise<{success: boolean, token?: string, message?: string}> {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 简单的模拟验证逻辑
        if (username === 'admin' && password === '123456') {
            return {
                success: true,
                token: 'mock_token_' + Date.now()
            };
        } else if (username === 'test' && password === 'test') {
            return {
                success: true,
                token: 'mock_token_' + Date.now()
            };
        } else {
            return {
                success: false,
                message: '用户名或密码错误'
            };
        }
    }

    /**
     * 处理游客登录
     */
    private handleGuestLogin(): void {
        // 设置游客标识
        localStorage.setItem('userToken', 'guest_token');
        localStorage.setItem('username', '游客用户');
        
        this.showMessage('以游客身份登录成功！', 'success');
        
        this.time.delayedCall(800, () => {
            this.goToMainMenu();
        });
    }

    /**
     * 处理第三方登录
     */
    private handleThirdPartyLogin(): void {
        console.log('🔗 Third party login clicked, redirecting to /api/me');
        
        // 显示跳转提示
        this.showMessage('正在跳转到第三方登录...', 'info');
        
        // 获取环境变量中的基础URL，拼接/api/me路径
        const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/api/me`;
        console.log('🔗 Redirecting to:', loginUrl);
        
        // 在新窗口中打开第三方登录页面
        const loginWindow = window.open(loginUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        // 监听第三方登录窗口
        this.monitorThirdPartyLogin(loginWindow);
    }

    /**
     * 监听第三方登录窗口和数据回调
     */
    private monitorThirdPartyLogin(loginWindow: Window | null): void {
        if (!loginWindow) {
            this.showMessage('无法打开登录窗口', 'error');
            return;
        }

        // 设置消息监听器，用于接收第三方登录的数据
        const messageListener = (event: MessageEvent) => {
            // 验证消息来源（安全考虑）
            const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
            const allowedOrigin = new URL(baseUrl).origin;
            
            if (event.origin !== allowedOrigin) {
                console.warn('🚫 Received message from unauthorized origin:', event.origin);
                return;
            }

            console.log('📨 Received third party login data:', event.data);
            
            // 处理登录成功的数据
            if (event.data && event.data.type === 'THIRD_PARTY_LOGIN_SUCCESS') {
                this.handleThirdPartyLoginSuccess(event.data.payload);
                // 移除监听器
                window.removeEventListener('message', messageListener);
                // 关闭登录窗口
                if (loginWindow && !loginWindow.closed) {
                    loginWindow.close();
                }
            } else if (event.data && event.data.type === 'THIRD_PARTY_LOGIN_ERROR') {
                this.handleThirdPartyLoginError(event.data.payload);
                // 移除监听器
                window.removeEventListener('message', messageListener);
            }
        };

        // 添加消息监听器
        window.addEventListener('message', messageListener);

        // 定期检查窗口是否被用户手动关闭
        const checkClosed = setInterval(() => {
            if (loginWindow.closed) {
                console.log('🔒 Third party login window was closed');
                this.showMessage('第三方登录已取消', 'info');
                window.removeEventListener('message', messageListener);
                clearInterval(checkClosed);
            }
        }, 1000);

        // 设置超时（5分钟）
        setTimeout(() => {
            if (!loginWindow.closed) {
                loginWindow.close();
                this.showMessage('登录超时，请重试', 'error');
            }
            window.removeEventListener('message', messageListener);
            clearInterval(checkClosed);
        }, 300000); // 5分钟超时
    }

    /**
     * 处理第三方登录成功
     * 根据实际API响应格式处理用户数据：
     * {"code":200,"data":{"id":5,"username":"PyCmg","coins":0,"avatar":"...","email":null,"sduid":"..."},"msg":"获取用户信息成功"}
     */
    private handleThirdPartyLoginSuccess(responseData: any): void {
        console.log('✅ Third party login successful:', responseData);
        
        // 解析API响应数据
        let userData = null;
        let authToken = null;
        
        // 处理标准API响应格式
        if (responseData && responseData.code === 200 && responseData.data) {
            userData = responseData.data;
            // 如果响应中包含token，使用它；否则可能需要从其他地方获取
            authToken = responseData.token || responseData.data.token || null;
        } else if (responseData && responseData.userInfo) {
            // 兼容旧格式
            userData = responseData.userInfo;
            authToken = responseData.token;
        } else {
            console.error('❌ Invalid response format:', responseData);
            this.handleThirdPartyLoginError({ message: '登录数据格式错误' });
            return;
        }
        
        // 保存认证令牌（如果有的话）
        if (authToken) {
            localStorage.setItem('authToken', authToken);
            console.log('🔑 Auth token saved');
        } else {
            console.warn('⚠️ No auth token provided in response');
            // 可以生成一个临时标识或使用用户ID作为标识
            if (userData.id) {
                localStorage.setItem('userId', userData.id.toString());
            }
        }
        
        // 保存用户信息
        if (userData) {
            // 标准化用户信息格式
            const standardUserInfo = {
                id: userData.id,
                username: userData.username,
                name: userData.username || userData.name, // 使用username作为显示名称
                email: userData.email,
                avatar: userData.avatar,
                coins: userData.coins || 0,
                maxCoins: userData.maxCoins || 0,
                sduid: userData.sduid,
                createdAt: userData.createdAt
            };
            
            localStorage.setItem('userInfo', JSON.stringify(standardUserInfo));
            console.log('👤 User info saved:', standardUserInfo);
            
            // 显示个性化欢迎消息
            const displayName = userData.username || userData.name || '用户';
            this.showMessage(`欢迎回来，${displayName}！`, 'success');
            
            // 显示用户金币信息（如果有的话）
            if (userData.coins !== undefined) {
                setTimeout(() => {
                    this.showMessage(`当前金币：${userData.coins}`, 'info');
                }, 800);
            }
        } else {
            console.error('❌ No user data found in response');
            this.handleThirdPartyLoginError({ message: '未获取到用户信息' });
            return;
        }
        
        // 延迟跳转到主菜单
        setTimeout(() => {
            this.goToMainMenu();
        }, 2000); // 增加延迟时间，让用户看到所有消息
    }

    /**
     * 处理第三方登录错误
     */
    private handleThirdPartyLoginError(error: any): void {
        console.error('❌ Third party login failed:', error);
        this.showMessage(error.message || '第三方登录失败，请重试', 'error');
    }

    /**
     * 处理注册
     */
    private handleRegister(): void {
        this.showMessage('注册功能开发中...', 'info');
        // 这里可以跳转到注册场景或显示注册表单
    }

    /**
     * 显示消息提示
     */
    private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db'
        };

        // 移除之前的消息
        const existingMessage = this.children.getByName('messageText') as GameObjects.Text;
        if (existingMessage) {
            existingMessage.destroy();
        }

        // 创建新消息
        const messageText = this.add.text(this.cameras.main.centerX, 100, message, {
            fontSize: '16px',
            color: colors[type],
            fontFamily: '微软雅黑, Arial',
            fontStyle: 'bold',
            backgroundColor: '#ffffff',
            padding: { x: 15, y: 8 }
        });
        messageText.setOrigin(0.5);
        messageText.setName('messageText');
        messageText.setDepth(1000);

        // 添加淡出动画
        this.tweens.add({
            targets: messageText,
            alpha: 0,
            duration: 3000,
            delay: 1000,
            onComplete: () => {
                messageText.destroy();
            }
        });
    }

    /**
     * 显示加载状态
     */
    private showLoadingState(show: boolean): void {
        if (show) {
            if (!this.loadingText) {
                this.loadingText = this.add.text(0, 80, '登录中...', {
                    fontSize: '14px',
                    color: '#7f8c8d',
                    fontFamily: '微软雅黑, Arial'
                });
                this.loadingText.setOrigin(0.5);
                this.loginModal?.add(this.loadingText);
            }
        } else {
            if (this.loadingText) {
                this.loadingText.destroy();
                this.loadingText = null;
            }
        }
    }

    /**
     * 跳转到主菜单
     */
    private goToMainMenu(): void {
        console.log('🎮 Login successful, going to MainMenu...');
        
        // 清理HTML输入框
        this.cleanupHTMLInputs();
        
        // 场景切换动画
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
    }

    /**
     * 清理HTML输入框
     */
    private cleanupHTMLInputs(): void {
        if (this.usernameInput) {
            document.body.removeChild(this.usernameInput);
            this.usernameInput = null;
        }
        if (this.passwordInput) {
            document.body.removeChild(this.passwordInput);
            this.passwordInput = null;
        }
    }

    /**
     * 场景销毁时的清理工作
     */
    destroy(): void {
        this.cleanupHTMLInputs();
        super.destroy();
    }
}