import {GameObjects, Scene} from "phaser";
import {CommonFunction} from "../../utils/CommonFunction.ts";
import {CustomerOrder} from "./Game.ts";

export class GameEntrance extends Scene{
    
    // Use a map to store buttons instead of dynamic properties
    private buttons: Map<string, GameObjects.Container> = new Map();
    
    private currentOrder: CustomerOrder;
    
    constructor() {
        super('GameEntrance');
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('GameEntrance received order:', this.currentOrder);

        // Check for overall project completion when the scene starts
        this.checkProjectCompletion();
    }
    
    create() 
    {
        const buttonDefs = [
            { id: 'product_design', name: '产品设计', scene: 'ProductGame' },
            { id: 'visual_design', name: '视觉设计', scene: 'VisionGame' },
            { id: 'frontend_dev', name: '前端开发', scene: 'FrontEndGame' },
            { id: 'backend_dev', name: '后端开发', scene: 'BackEndGame' }
        ];

        buttonDefs.forEach((def, index) => {
            const task = this.currentOrder.items.find(item => item.item.id === def.id);
            const yPos = 100 + index * 200;

            const button = CommonFunction.createButton(this, 850, yPos, 'button-normal', 'button-pressed', def.name, 10, () => {
                this.scene.start(def.scene, { order: this.currentOrder });
            });
            this.buttons.set(def.id, button);

            if (task && task.status === 'completed') {
                button.setAlpha(0.5); // Make it look disabled
                const textObject = button.list.find((obj: any) => obj.type === 'Text') as GameObjects.Text;
                if (textObject) {
                    textObject.setText(`✅ ${def.name}`);
                }
                // Disable the button's interactivity
                button.list.forEach((child: any) => {
                    if (child instanceof GameObjects.Image) {
                        child.removeInteractive();
                    }
                });
            }
        });
        
        // Add a back button
        CommonFunction.createButton(this, 150, 700, 'button-normal', 'button-pressed', '返回主界面', 10, () => {
            // When going back manually, we need to tell the Game scene to reload the state
            // we saved before entering the minigames.
            this.scene.start('Game');
        });
    }
    
    private checkProjectCompletion() {
        const allTasksCompleted = this.currentOrder.items.every(item => item.status === 'completed');

        if (allTasksCompleted) {
            console.log(`项目 ${this.currentOrder.id} 全部完成! 返回主界面进行结算。`);
            
            // Show a success message
            CommonFunction.showToast(this, '项目开发完成!', 2000, 'success');

            this.time.delayedCall(2000, () => {
                // When we return, we pass the completed order back to the main Game scene
                // so it can handle the reward and removal.
                this.scene.start('Game', { completedOrder: this.currentOrder });
            });
        }
    }
}