import {GameObjects, Scene} from "phaser";

export class CommonFunction 
{
    /**
     * create button
     * @param scene - the current scene
     * @param x - the x position of the button
     * @param y - the y position of the button
     * @param key - the kay-name of a pic
     * @param key_pressed - the key-name of a pic when the button is pressed
     * @param text - the text of the button
     * @param depth - the depth of the button
     * @param callback - the callback function of the button
     * @returns the button object
     */
    public static createButton(
        scene: Scene, 
        x: number, 
        y: number, 
        key: string, 
        key_pressed: string,
        text: string,
        depth: number,
        callback: () => void,
        enableHover: boolean = true, // 新增参数，默认启用悬停
        scale: number = 1
    ): GameObjects.Container {
        const container: GameObjects.Container = scene.add.container(x, y);
        
        // the bg of the button
        const buttonBg = scene.add.image(0, 0, key);
        buttonBg.setScale(1.2);
        
        // some decoration
        // TODO add some code into the function to add some decoration aimed at improve the function's usability
        
        // the text of the buttton
        const buttonText = scene.add.text(0, 0, text, {
            fontFamily: 'Arial Black, SimHei, Microsoft YaHei',
            fontSize: 20,
            color: '#5D4037',
            stroke: '#FFF',
            strokeThickness: 2,
            align: 'center',
        }).setOrigin(0.5);
        container.add([buttonBg, buttonText]);
        container.setDepth(depth);
        container.setSize(buttonBg.width * 1.2, buttonBg.height * 1.2);
        container.setScale(scale);
        
        container.setInteractive();
        
        if (enableHover) { // 根据参数决定是否添加悬停事件
            container.on('pointerover', () => {
                scene.tweens.add({
                    targets: container,
                    scaleX: scale * 1.05,
                    scaleY: scale * 1.05,
                    duration: 150,
                    ease: "Power2"
                })
            })
            
            container.on('pointerout', () => {
                scene.tweens.add({
                    targets: container,
                    scaleX: scale,
                    scaleY: scale,
                    duration: 150,
                    ease: "Power2"
                })    
                
                scene.tweens.add({
                    targets: buttonBg,
                    alpha: 1,
                    duration: 200,
                    ease: 'Power2'
                })
            })
        }
        
        container.on("pointerdown", () => {
            buttonBg.setTexture(key_pressed);
            
            scene.tweens.add({
                targets: container,
                scaleX: scale * 0.95,
                scaleY: scale * 0.95,
                duration: 100,
                ease: 'Power2'
            })
        })
        
        container.on('pointerup', () => {
            buttonBg.setTexture(key);
            
            scene.tweens.add({
                targets: container,
                scaleX: scale,
                scaleY: scale,
                duration: 100,
                ease: 'Power2'
            })
            
            callback();
            
        })
        
        return container;
        
    }
    /**
     * 创建 book 图标按钮
     * @param scene - 当前场景
     * @param x - x 坐标
     * @param y - y 坐标
     * @param callback - 点击后的回调（可选，默认弹窗）
     * @param scale - 图标缩放（可选，默认 0.37）
     * @param depth - 层级（可选，默认 100）
     * @returns 图标对象
     */
    public static createBookInfoButton(
        scene: Scene,
        x: number = scene.cameras.main.width - 50,
        y: number = 50,
        title: string = '',
        text: string = '',
        callback?: () => void,
        scale: number = 0.37,
        depth: number = 100
    ): GameObjects.Image {
        const icon = scene.add.image(x, y, 'book').setInteractive().setScale(scale).setDepth(depth);
        icon.on('pointerover', () => {
            scene.tweens.add({ targets: icon, scale: scale + 0.02, duration: 120 });
        });
        icon.on('pointerout', () => {
            scene.tweens.add({ targets: icon, scale: scale, duration: 120 });
        });
        icon.on('pointerdown', () => {
            if (callback) {
                callback();
            } else {
                CommonFunction.showGameIntroPopup(scene,title,text);
            }
        });
        return icon;
    }

    /**
     * 弹窗（静态方法，供 book 图标按钮调用）
     * @param scene - 当前场景
     */
    public static showGameIntroPopup(scene: Scene, title: string,text: string): void {
        const formattedText = text.replace(/(.{20})/g, '$1\n');
        CommonFunction.createDialog(
            scene,
            scene.cameras.main.centerX,
            scene.cameras.main.centerY,
            500,
            350,
            title,
            formattedText,
            () => {}
        );
    }
    /**
     * create a background of a scene
     * @param scene - the current scene
     * @param x - the x position of the background
     * @param y - the y position of the background
     * @param key - the key-name of a pic as a background
     */
    public static createBackground(
        scene: Scene,
        x: number,
        y: number,
        key: string
    ): GameObjects.Image {
        const background = scene.add.image(x, y, key);
        // full-screen background
        const scaleX = scene.cameras.main.width / background.width;
        const scaleY = scene.cameras.main.height / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale);
        
        return background;
    }

    // ==================== 动画相关方法 ====================

    /**
     * 淡入动画
     * @param scene - 当前场景
     * @param target - 目标对象
     * @param duration - 动画持续时间
     * @param onComplete - 完成回调
     */
    public static fadeIn(
        scene: Scene,
        target: any,
        duration: number = 500,
        onComplete?: () => void
    ): Phaser.Tweens.Tween {
        target.setAlpha(0);
        return scene.tweens.add({
            targets: target,
            alpha: 1,
            duration: duration,
            ease: 'Power2',
            onComplete: onComplete
        });
    }

    /**
     * 淡出动画
     * @param scene - 当前场景
     * @param target - 目标对象
     * @param duration - 动画持续时间
     * @param onComplete - 完成回调
     */
    public static fadeOut(
        scene: Scene,
        target: any,
        duration: number = 500,
        onComplete?: () => void
    ): Phaser.Tweens.Tween {
        return scene.tweens.add({
            targets: target,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: onComplete
        });
    }

    /**
     * 弹性缩放动画
     * @param scene - 当前场景
     * @param target - 目标对象
     * @param scale - 目标缩放值
     * @param duration - 动画持续时间
     */
    public static bounceScale(
        scene: Scene,
        target: any,
        scale: number = 1.2,
        duration: number = 300
    ): Phaser.Tweens.Tween {
        return scene.tweens.add({
            targets: target,
            scaleX: scale,
            scaleY: scale,
            duration: duration,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 0
        });
    }

    /**
     * 摇摆动画
     * @param scene - 当前场景
     * @param target - 目标对象
     * @param intensity - 摇摆强度
     * @param duration - 动画持续时间
     */
    public static shake(
        scene: Scene,
        target: any,
        intensity: number = 10,
        duration: number = 500
    ): Phaser.Tweens.Tween {
        const originalX = target.x;
        return scene.tweens.add({
            targets: target,
            x: originalX + intensity,
            duration: 50,
            ease: 'Power2',
            yoyo: true,
            repeat: Math.floor(duration / 100),
            onComplete: () => {
                target.setX(originalX);
            }
        });
    }

    /**
     * 打字机效果
     * @param scene - 当前场景
     * @param textObject - 文本对象
     * @param fullText - 完整文本
     * @param speed - 打字速度(毫秒)
     * @param onComplete - 完成回调
     */
    public static typeWriter(
        scene: Scene,
        textObject: GameObjects.Text,
        fullText: string,
        speed: number = 50,
        onComplete?: () => void
    ): Phaser.Time.TimerEvent {
        let currentText = '';
        let index = 0;
        
        return scene.time.addEvent({
            delay: speed,
            repeat: fullText.length - 1,
            callback: () => {
                currentText += fullText[index];
                textObject.setText(currentText);
                index++;
                
                if (index >= fullText.length && onComplete) {
                    onComplete();
                }
            }
        });
    }

    // ==================== UI组件方法 ====================

    /**
     * 创建进度条
     * @param scene - 当前场景
     * @param x - X坐标
     * @param y - Y坐标
     * @param width - 宽度
     * @param height - 高度
     * @param bgColor - 背景色
     * @param fillColor - 填充色
     * @param borderColor - 边框色
     */
    public static createProgressBar(
        scene: Scene,
        x: number,
        y: number,
        width: number = 200,
        height: number = 20,
        bgColor: number = 0x222222,
        fillColor: number = 0x00FF00,
        borderColor: number = 0xFFFFFF
    ): { container: GameObjects.Container; updateProgress: (progress: number) => void } {
        const container = scene.add.container(x, y);
        
        // 背景
        const bg = scene.add.graphics();
        bg.fillStyle(bgColor);
        bg.fillRect(-width/2, -height/2, width, height);
        
        // 边框
        const border = scene.add.graphics();
        border.lineStyle(2, borderColor);
        border.strokeRect(-width/2, -height/2, width, height);
        
        // 进度条
        const progressBar = scene.add.graphics();
        
        container.add([bg, progressBar, border]);
        
        const updateProgress = (progress: number) => {
            progress = Phaser.Math.Clamp(progress, 0, 1);
            progressBar.clear();
            progressBar.fillStyle(fillColor);
            progressBar.fillRect(-width/2 + 2, -height/2 + 2, (width - 4) * progress, height - 4);
        };
        
        return { container, updateProgress };
    }

    /**
     * 创建对话框
     * @param scene - 当前场景
     * @param x - X坐标
     * @param y - Y坐标
     * @param width - 宽度
     * @param height - 高度
     * @param title - 标题
     * @param content - 内容
     * @param onClose - 关闭回调
     */
    public static createDialog(
        scene: Scene,
        x: number,
        y: number,
        width: number = 400,
        height: number = 300,
        title: string = '提示',
        content: string = '',
        onClose?: () => void
    ): GameObjects.Container {
        const container = scene.add.container(x, y);
        
        // 半透明背景遮罩
        const overlay = scene.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(-scene.cameras.main.width/2, -scene.cameras.main.height/2, scene.cameras.main.width, scene.cameras.main.height);
        
        // 对话框背景
        const dialogBg = scene.add.graphics();
        dialogBg.fillStyle(0xFFFFFF, 0.95);
        dialogBg.lineStyle(3, 0x333333);
        dialogBg.fillRoundedRect(-width/2, -height/2, width, height, 10);
        dialogBg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
        
        // 标题
        const titleText = scene.add.text(0, -height/2 + 30, title, {
            fontSize: '24px',
            color: '#333333',
            fontFamily: 'Arial, SimHei, Microsoft YaHei'
        }).setOrigin(0.5);
        
        // 内容
        const contentText = scene.add.text(0, -20, content, {
            fontSize: '16px',
            color: '#666666',
            fontFamily: 'Arial, SimHei, Microsoft YaHei',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
        
        // 关闭按钮
        const closeBtn = scene.add.text(width/2 - 20, -height/2 + 20, '×', {
            fontSize: '30px',
            color: '#999999'
        }).setOrigin(0.5);
        
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => {
            container.destroy();
            if (onClose) onClose();
        });
        
        container.add([overlay, dialogBg, titleText, contentText, closeBtn]);
        container.setDepth(1000);
        
        // 弹出动画
        container.setScale(0);
        scene.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        return container;
    }

    /**
     * 创建提示消息
     * @param scene - 当前场景
     * @param message - 消息内容
     * @param duration - 显示时长
     * @param type - 消息类型
     */
    public static showToast(
        scene: Scene,
        message: string,
        duration: number = 2000,
        type: 'success' | 'warning' | 'error' | 'info' = 'info'
    ): void {
        const colors = {
            success: 0x4CAF50,
            warning: 0xFF9800,
            error: 0xF44336,
            info: 0x2196F3
        };
        
        const toast = scene.add.container(scene.cameras.main.width / 2, 100);
        
        const bg = scene.add.graphics();
        bg.fillStyle(colors[type], 0.9);
        bg.fillRoundedRect(-150, -25, 300, 50, 25);
        
        const text = scene.add.text(0, 0, message, {
            fontSize: '16px',
            color: '#FFFFFF',
            fontFamily: 'Arial, SimHei, Microsoft YaHei'
        }).setOrigin(0.5);
        
        toast.add([bg, text]);
        toast.setDepth(2000);
        
        // 动画效果
        toast.setAlpha(0);
        toast.setY(50);
        
        scene.tweens.add({
            targets: toast,
            alpha: 1,
            y: 100,
            duration: 300,
            ease: 'Power2'
        });
        
        scene.time.delayedCall(duration, () => {
            scene.tweens.add({
                targets: toast,
                alpha: 0,
                y: 50,
                duration: 300,
                ease: 'Power2',
                onComplete: () => toast.destroy()
            });
        });
    }

    // ==================== 场景管理方法 ====================

    /**
     * 场景淡入淡出切换
     * @param scene - 当前场景
     * @param targetScene - 目标场景键名
     * @param duration - 切换时长
     * @param data - 传递给新场景的数据
     */
    public static fadeToScene(
        scene: Scene,
        targetScene: string,
        duration: number = 500,
        data?: any
    ): void {
        scene.cameras.main.fadeOut(duration, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            scene.scene.start(targetScene, data);
        });
    }

    /**
     * 暂停场景
     * @param scene - 当前场景
     */
    public static pauseScene(scene: Scene): void {
        scene.scene.pause();
        scene.physics.pause();
    }

    /**
     * 恢复场景
     * @param scene - 当前场景
     */
    public static resumeScene(scene: Scene): void {
        scene.scene.resume();
        scene.physics.resume();
    }

    // ==================== 音效管理方法 ====================

    /**
     * 播放音效
     * @param scene - 当前场景
     * @param key - 音效键名
     * @param volume - 音量
     * @param loop - 是否循环
     */
    public static playSound(
        scene: Scene,
        key: string,
        volume: number = 1,
        loop: boolean = false
    ): Phaser.Sound.BaseSound | null {
        if (scene.sound.get(key)) {
            const sound = scene.sound.add(key, { volume, loop });
            sound.play();
            return sound;
        }
        return null;
    }

    /**
     * 停止所有音效
     * @param scene - 当前场景
     */
    public static stopAllSounds(scene: Scene): void {
        scene.sound.stopAll();
    }

    // ==================== 随机分布方法 ====================
    /**
     * 按照给定的概率分布随机产生实体
     * @param items - 实体列表
     * @param probabilities - 对应的概率列表, 总和为1
     * @returns 随机产生的实体
     */
    public static RandomDistribution<T>(items: T[], probabilities: number[]) : T{
        if (items.length < 1) {
            throw new Error("items array must have at least one item");
        }
        if (items.length != probabilities.length) {
            throw new Error("items and probabilities arrays must have the same length");
        }
        if (Math.abs(probabilities.reduce((sum, p) => sum + p) - 1) >= 1e-6) {
            throw new Error("probabilities array must sum up to 1");
        }
        for (let i = 0; i < probabilities.length; i++) {
            if (probabilities[i] <0 || probabilities[i]>1 || isNaN(probabilities[i]) || probabilities[i] == null) {
                throw new Error(`the ${i} item of the probabilities is not valid`);
            }
            if (items[i] == null) {
                throw new Error(`the ${i} item of the items is not valid`);
            }
        }
        
        const tempArr: number[] = []
        tempArr.push(probabilities[0])
        for (let i = 1; i < probabilities.length; i++) {
            tempArr.push(probabilities[i] + tempArr[i-1]);
        }
        
        const random = Math.random();
        for (let i = 0; i < tempArr.length; i++) {
            if (random <= tempArr[i]) {
                return items[i];
            }
        }
        
        return items[items.length-1];
    }
    
    // =====================创建弹窗============
    /**
     * 当玩家完成游戏后给予的通知弹窗
     * @param scene - 当前场景
     * @param x - X坐标
     * @param y - Y坐标
     * @param width - 宽度
     * @param height - 高度
     * @param text - 文本内容
     * @param title - 标题
     * @param callback - 回调函数
     */
    public static createConfirmPopup(
        scene: Scene,
        x: number,
        y: number,
        width: number = 1024,
        height: number,
        text: string,
        title: string,
        callback: () => void
    ) {
        scene.add.rectangle(0, 0, 1024, 768, 0x000000, 0.7).setOrigin(0).setInteractive().setVisible(true);
        const container = scene.add.container(x, y).setVisible(true);
        // 禁用容器的裁剪功能
        container.setSize(width, height);
        const bg = scene.add.nineslice(0, 0, 'confirm-pop-up', undefined, width, height, 20, 20);
        // 适当调整文本的 y 坐标
        const txt = scene.add.text(0, -20, text, { fontSize: 20, color: '#000' }).setOrigin(0.5);
        const tle = scene.add.text(0, -180, title, { fontSize: 25, color: '#fff' }).setOrigin(0.5);
        const confirmBtn = this.createButton(scene, 0, 150, 'button-normal', 'button-pressed', '确认', 21, callback);
        container.add([bg, txt, confirmBtn, tle]);
    }
}