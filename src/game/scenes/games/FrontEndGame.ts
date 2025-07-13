import { Scene } from "phaser";
import {CustomerOrder} from "../Game.ts";
import {CommonFunction} from "../../../utils/CommonFunction.ts";

export class FrontEndGame extends Scene
{
    private currentOrder: CustomerOrder;

    constructor()
    {
        super("FrontEndGame");
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('FrontEndGame received order:', this.currentOrder);
    }

    create()
    {
        // Simple background for now
        this.cameras.main.setBackgroundColor('#4e8df2');

        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY, 'button-normal', 'button-pressed', '完成前端', 10, () => {
            console.log('前端开发完成，返回开发中心');

            const task = this.currentOrder.items.find(item => item.item.id === 'frontend_dev');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }

            this.scene.start('GameEntrance', { order: this.currentOrder });
        });
        
    }
}
