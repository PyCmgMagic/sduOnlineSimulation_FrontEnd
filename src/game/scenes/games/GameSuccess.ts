import {Scene} from "phaser";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import {CustomerOrder} from "../Game.ts"; 

export class GameSuccess extends Scene {
    
    private currentOrder: CustomerOrder;
    
    constructor() {
        super('GameSuccess');
    }
    
    init(data: {currentOrder: CustomerOrder})
    {
        this.currentOrder = data.currentOrder;
    }
    
    preload()
    {
        
    }
    
    create()
    {
        CommonFunction.createConfirmPopup(this, 512, 368,1024, 500, '您的产品设计已完成！', '成功啊', () => {
            console.log('产品开发完成，返回开发中心!');

            const task = this.currentOrder.items.find(item => item.item.id === 'product_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }

            this.scene.start('GameEntrance', {order: this.currentOrder});
        })
    }
}
