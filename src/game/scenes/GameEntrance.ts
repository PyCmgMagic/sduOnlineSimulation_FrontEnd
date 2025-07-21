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
        
        for(let i = 0; i < screenX; i++) {
            const image = this.add.image(screenX + 20 + i * 60, screenY - 20, imageKeys[i]);
            image.setScale(50 / image.width);
            image.setInteractive();
            image.on('pointerdown', () => {
                this.scene.start(sceneKeys[i], {order: this.currentOrder});
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
        
        // const xd = this.add.image(screenX + 20, screenY - 20, 'game-entrance-xd');
        // xd.setScale(50 / xd.width);
    }
}