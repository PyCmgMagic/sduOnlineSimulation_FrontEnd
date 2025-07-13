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
        // Add a progress bar
        const progressBar = CommonFunction.createProgressBar(this, 850, 40, 300, 25);
        this.progressBarUpdater = progressBar.updateProgress;
        this.progressText = this.add.text(850, 70, '进度: 0%', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

        const buttonDefs = [
            { id: 'product_design', name: '产品设计', scene: 'ProductGame' },
            { id: 'visual_design', name: '视觉设计', scene: 'VisionGame' },
            { id: 'frontend_dev', name: '前端开发', scene: 'FrontEndGame' },
            { id: 'backend_dev', name: '后端开发', scene: 'BackEndGame' }
        ];

        buttonDefs.forEach((def, index) => {
            const task = this.currentOrder.items.find(item => item.item.id === def.id);
            const yPos = 150 + index * 120; // Adjusted spacing

            const button = CommonFunction.createButton(this, 850, yPos, 'button-normal', 'button-pressed', def.name, 10, () => {
                this.scene.start(def.scene, { order: this.currentOrder });
            }, true, 0.9);
            this.buttons.set(def.id, button);

            if (task && task.status === 'completed') {
                button.setAlpha(0.5); // Make it look disabled
                const textObject = button.list.find((obj: any) => obj.type === 'Text') as GameObjects.Text;
                if (textObject) {
                    textObject.setText(`✅ ${def.name}`);
                }
                // Disable interactivity for the entire container
                button.disableInteractive();
            }
        });
        
        // Add a back button
        this.backButton = CommonFunction.createButton(this, 150, 700, 'button-normal', 'button-pressed', '返回主界面', 10, () => {
            this.scene.start('Game');
        });

        // Add a submit button (initially hidden)
        this.submitButton = CommonFunction.createButton(this, 850, 650, 'button-normal', 'button-pressed', '提交项目', 10, () => {
            this.scene.start('Game', { completedOrder: this.currentOrder });
        });
        this.submitButton.setVisible(false);

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
}