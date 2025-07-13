import { Scene } from "phaser";
import {CustomerOrder} from "../Game.ts";
import {CommonFunction} from "../../../utils/CommonFunction.ts";

export class VisionGame extends Scene
{
    private currentOrder: CustomerOrder;
    
    constructor() 
    {
        super("VisionGame");
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('VisionGame received order:', this.currentOrder);
    }
    
    create()
    {
        // Simple background for now
        this.cameras.main.setBackgroundColor('#a2a2a2');

        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY, 'button-normal', 'button-pressed', '完成视觉', 10, () => {
            console.log('视觉设计完成，返回开发中心');

            const task = this.currentOrder.items.find(item => item.item.id === 'visual_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }

            this.scene.start('GameEntrance', { order: this.currentOrder });
        });
    }
}