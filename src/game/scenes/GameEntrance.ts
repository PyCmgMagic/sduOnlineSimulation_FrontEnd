import {GameObjects, Scene} from "phaser";
import {CommonFunction} from "../../utils/CommonFunction.ts";
import {CustomerOrder} from "./Game.ts";

export class GameEntrance extends Scene{
    
    // Use a map to store buttons instead of dynamic properties
    private buttons: Map<string, GameObjects.Container> = new Map();
    private submitButton: GameObjects.Container;
    private backButton: GameObjects.Container;
    private progressBarUpdater: (progress: number) => void;
    private progressText: GameObjects.Text;
    
    private currentOrder: CustomerOrder;
    
    constructor() {
        super('GameEntrance');
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('GameEntrance received order:', this.currentOrder);
    }
    
    create() 
    {
        this.createComputerArea();
        this.createOperateButtons();
        this.createProgressBar();

        // const buttonDefs = [
        //     { id: 'product_design', name: '产品设计', scene: 'ProductGame' },
        //     { id: 'visual_design', name: '视觉设计', scene: 'VisionGame' },
        //     { id: 'frontend_dev', name: '前端开发', scene: 'FrontEndGame' },
        //     { id: 'backend_dev', name: '后端开发', scene: 'BackEndGame' }
        // ];
        //
        // buttonDefs.forEach((def, index) => {
        //     const task = this.currentOrder.items.find(item => item.item.id === def.id);
        //     const yPos = 150 + index * 120; // Adjusted spacing
        //
        //     const button = CommonFunction.createButton(this, 850, yPos, 'button-normal', 'button-pressed', def.name, 10, () => {
        //         this.scene.start(def.scene, { order: this.currentOrder });
        //     }, true, 0.9);
        //     this.buttons.set(def.id, button);
        //
        //     if (task && task.status === 'completed') {
        //         button.setAlpha(0.5); // Make it look disabled
        //         const textObject = button.list.find((obj: any) => obj.type === 'Text') as GameObjects.Text;
        //         if (textObject) {
        //             textObject.setText(`✅ ${def.name}`);
        //         }
        //         // Disable interactivity for the entire container
        //         button.disableInteractive();
        //     }
        // });
        

        // Update UI based on the current order state
        this.updateUIState();
    }
    
    private updateUIState() {
        const totalTasks = this.currentOrder.items.length;
        if (totalTasks === 0) return;

        const completedTasks = this.currentOrder.items.filter(item => item.status === 'completed').length;
        const progress = completedTasks / totalTasks;

        this.progressBarUpdater(progress);
        this.progressText.setText(`进度: ${Math.round(progress * 100)}%`);

        const allTasksCompleted = completedTasks === totalTasks;

        if (allTasksCompleted) {
            this.buttons.forEach(button => button.setVisible(false));
            this.submitButton.setVisible(true);
            this.backButton.setVisible(false); // Hide back button to encourage submission
        } else {
            this.submitButton.setVisible(false);
        }
    }
    private createOperateButtons() {
        // Add a back button
        this.backButton = this.add.container(150, 700);
        const backImage = this.add.image(25, 10, 'game-entrance-arrow-w');
        backImage.setScale(2);
        const text_back = this.add.text(0, 0, "返回", {
            fontSize: 15,
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        })
        backImage.setInteractive();
        backImage.on('pointerover', () => {
            backImage.setScale(2.2)
        })
        backImage.on('pointerout', () => {
            backImage.setScale(2)
        })
        backImage.on('pointerdown', () => {
            backImage.setScale(1.8)
        })
        backImage.on('pointerup', () => {
            this.scene.start("Game")
        })
        this.backButton.add([backImage, text_back])
        
        
        
        // this.backButton = CommonFunction.createButton(this, 150, 700, 'game-entrance-arrow', 'game-entrance-arrow', '返回主界面', 10, () => {
        //     this.scene.start('Game');
        // });

        // Add a submit-button (initially hidden)
        
        this.submitButton = this.add.container(850, 700);
        const submitImage = this.add.image(32, 10, 'game-entrance-arrow-e');
        submitImage.setScale(2.3);
        const text_summit = this.add.text(0, 0, "提交项目", {
            fontSize: 15,
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        })
        submitImage.setInteractive();
        submitImage.on('pointerover', () => {
            submitImage.setScale(2.2)
        })
        submitImage.on('pointerout', () => {
            submitImage.setScale(2)
        })
        submitImage.on('pointerdown', () => {
            submitImage.setScale(1.8)
        })
        submitImage.on('pointerup', () => {
            this.scene.start("Game", {completedOrder: this.currentOrder})
        })
        this.submitButton.add([submitImage, text_summit])
        this.submitButton.setVisible(true);
        
        // this.submitButton = CommonFunction.createButton(this, 850, 650, 'button-normal', 'button-pressed', '提交项目', 10, () => {
        //     this.scene.start('Game', { completedOrder: this.currentOrder });
        // });
        // this.submitButton.setVisible(false);
    }
    
    private createProgressBar() {
        // Add a progress bar
        const progressBar = CommonFunction.createProgressBar(this, 850, 40, 300, 25);
        this.progressBarUpdater = progressBar.updateProgress;
        this.progressText = this.add.text(850, 70, '进度: 0%', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    }
    
    private createComputerArea() {
        const x: number = this.cameras.main.centerX;
        const y: number = this.cameras.main.centerY;
        
        const mac: GameObjects.Image = this.add.image(x, y + 25, 'game-entrance-mac');
        mac.setScale(0.7);
        
        const screenX: number = mac.x - mac.width / 2 + 380;
        const screenY: number = mac.y + mac.height / 2 - 420;
        
        const imageKeys: string[] = ['game-entrance-xd', 'game-entrance-ps', 'game-entrance-vsc', 'game-entrance-studio', 'game-entrance-idea']
        const sceneKeys: string[] = ['ProductGame', 'VisionGame', 'FrontEndGame', "FrontEndGame", 'BackEndGame']
        const ids: string[] = ['product_design', 'visual_design', 'frontend_dev', 'frontend_dev', 'backend_dev'];
        
        for(let i = 0; i < imageKeys.length; i++) {
            const image = this.add.image(screenX + 20 + i * 60, screenY - 20, imageKeys[i]);
            image.setScale(50 / image.width);
            image.setInteractive();
            
            // 为不同的图标添加特殊处理逻辑
            image.on('pointerdown', () => {
                if (imageKeys[i] === 'game-entrance-vsc') {
                    // 显示当前前端技术栈
                    this.showTechStackInfo();
                } else if (imageKeys[i] === 'game-entrance-studio') {
                    // 切换到移动端技术栈并进入游戏
                    this.switchToMobileTechStack();
                    this.scene.start(sceneKeys[i], {order: this.currentOrder});
                } else {
                    // 其他图标正常进入游戏
                    this.scene.start(sceneKeys[i], {order: this.currentOrder});
                }
                image.setScale(45 / image.width);
            })
            
            image.on('pointerover', () => {
                image.setScale(55 / image.width);
            })
            
            image.on('pointerout', () => {
                image.setScale(50 / image.width);
            })
            
            const task = this.currentOrder.items.find(item => item.item.id === ids[i]);
            
            if (task && task.status === 'completed') {
                image.setAlpha(0.5);
                image.disableInteractive();
            }
        }
        
    }
    
    /**
     * 显示当前前端技术栈信息
     */
    private showTechStackInfo(): void {
        const techStackInfo = [
            'HTML - 网页结构标记语言',
            'CSS - 样式表语言',
            'JS - JavaScript编程语言',
            'Vue - 渐进式前端框架',
            '性能优化 - 提升应用性能',
            'React - 用户界面库',
            '页面美化 - 界面设计优化',
            '增强 - 功能增强'
        ];
        
        const infoText = techStackInfo.join('\n');
        
        // 创建弹窗背景
        const popupBg = this.add.graphics();
        popupBg.fillStyle(0x000000, 0.8);
        popupBg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // 创建信息面板
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = (this.cameras.main.width - panelWidth) / 2;
        const panelY = (this.cameras.main.height - panelHeight) / 2;
        
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panel.lineStyle(3, 0x333333, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        
        // 添加标题
        const title = this.add.text(panelX + panelWidth / 2, panelY + 40, '前端开发技术栈', {
            fontSize: '28px',
            color: '#333333',
            fontFamily: '"Comic Sans MS", cursive'
        }).setOrigin(0.5);
        
        // 添加技术栈信息
        const content = this.add.text(panelX + 50, panelY + 100, infoText, {
            fontSize: '18px',
            color: '#444444',
            fontFamily: 'Arial, sans-serif',
            lineSpacing: 10
        });
        
        // 添加关闭按钮
        const closeButton = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 50, '关闭', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#007bff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        closeButton.on('pointerdown', () => {
            popupBg.destroy();
            panel.destroy();
            title.destroy();
            content.destroy();
            closeButton.destroy();
        });
        
        closeButton.on('pointerover', () => {
            closeButton.setStyle({ backgroundColor: '#0056b3' });
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setStyle({ backgroundColor: '#007bff' });
        });
    }
    
    /**
     * 切换到移动端技术栈
     */
    private switchToMobileTechStack(): void {
        // 这里我们需要修改FrontEndGame.ts中的getTextToShow方法
        // 由于无法直接修改其他文件的方法，我们通过全局变量或事件系统来实现
        (window as any).useMobileTechStack = true;
        
        console.log('已切换到移动端技术栈模式');
        
        // 显示切换提示
        const notification = this.add.text(this.cameras.main.centerX, 100, '已切换到移动端开发技术栈！', {
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // 2秒后移除提示
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
    }
}