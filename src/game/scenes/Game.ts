import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameObjects } from "phaser";
import { CommonFunction } from "../../utils/CommonFunction.ts";

// 定义菜单项接口
export interface MenuItem {
    id: string;
    name: string;
    price: number;
    description: string;
    icon: string;
    preparationTime: number; // 制作时间（秒）
}

// 定义顾客订单接口
export interface CustomerOrder {
    id: string;
    customerId: string;
    customerName: string;
    items: { item: MenuItem; quantity: number; status: 'pending' | 'completed' }[];
    total: number;
    status: 'waiting' | 'preparing' | 'ready' | 'served' | 'expired';
    orderTime: Date;
    ddl: number; // 截止日期 (剩余天数)
    totalDevTime: number; // 总开发时间
    preparationProgress: number; // 制作进度 (0-100)
}

// 定义顾客接口
export interface Customer {
    id: string;
    name: string;
    sprite?: GameObjects.Sprite; // 改为可选，因为sprite不能被存储
    order: CustomerOrder | null;
    position: { x: number; y: number };
    queuePosition: number; // 队列中的位置索引
    isActive: boolean;
    mood: 'happy' | 'neutral' | 'impatient' | 'angry';
}

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    
    button1: GameObjects.Container;
    
    // 经营游戏相关属性
    private menuItems: MenuItem[] = [];
    private customers: Customer[] = [];
    private customerOrders: CustomerOrder[] = [];
    private orderCounter: number = 1;
    private customerCounter: number = 1;
    private maxCustomers: number = 2;
    
    // 游戏状态
    private gameScore: number = 0;
    private gameTime: number = 0;
    private isGameRunning: boolean = false;
    private customerSpawnTimer: Phaser.Time.TimerEvent;
    // private patienceUpdateTimer: Phaser.Time.TimerEvent; // This timer is no longer used
    
    private orderToProcessOnCreate: CustomerOrder | null = null;
    
    // UI元素
    private ordersPanel: GameObjects.Container;
    private scoreDisplay: GameObjects.Text;
    private customerQueue: GameObjects.Container;
    private preparationPanel: GameObjects.Container;
    
    // 顾客名字池
    private customerNames: string[] = [
        '产品经理(PM)', '项目经理(PM)', '用户代表', '运营团队', '市场部', '老板', '投资人', '技术总监(CTO)',
        '设计师(UI/UX)', '客服团队', '数据分析师', '销售团队', '合作伙伴A', '合作伙伴B', '天使投资人', '竞争对手'
    ];

    constructor ()
    {
        super('Game');
        this.initializeMenuItems();
    }
    
    init(data: { completedOrder?: CustomerOrder }) {
        if (data && data.completedOrder) {
            console.log(`订单 ${data.completedOrder.id} 已被标记为待处理。`);
            this.orderToProcessOnCreate = data.completedOrder;
            // We do NOT process it here, because the scene's objects haven't been created yet.
        }
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.cameras.main.setBackgroundColor('#87CEEB'); // 天蓝色背景

        // --- 搭建咖啡馆 ---
        const centerX = this.cameras.main.width / 2;
        const groundY = this.cameras.main.height - 100; // 地面位置
        const cafeScale = 4; // 统一的缩放比例

        // 1. 墙体 (最顶层)
        const wall = this.add.image(centerX, 0, 'houseBeige');
        wall.setOrigin(0.5, 0); // 顶部中心
        const wallImage = this.textures.get('houseBeige');
        const scaleX = this.cameras.main.width / wallImage.source[0].width;
        wall.setScale(scaleX, cafeScale * 1.35);
        wall.setDepth(1);

        // 2. 墙体（下方）
        const wall2Y = wall.y + wall.displayHeight; // wall.displayHeight 是缩放后的高度
        const wall2 = this.add.image(centerX, wall2Y, 'houseDark');
        wall2.setOrigin(0.5, 0); // 顶部中心
        const wallImage2 = this.textures.get('houseDark');
        const scaleX2 = this.cameras.main.width / wallImage2.source[0].width;
        wall2.setScale(scaleX2, cafeScale * 0.45);
        wall2.setDepth(1);
        // 2. 墙体（底部）
        const wall3Y = wall2.y + wall2.displayHeight; // wall.displayHeight 是缩放后的高度
        const wall3 = this.add.image(centerX, wall3Y, 'houseGray');
        wall3.setOrigin(0.5, 0); // 顶部中心
        const wallImage3 = this.textures.get('houseGray');
        const scaleX3 = this.cameras.main.width / wallImage3.source[0].width;
        wall3.setScale(scaleX3, cafeScale * 1.3);
        wall3.setDepth(3);

        const playerCustomer = this.add.sprite(600, 400, 'player-customer', 0);
        playerCustomer.setScale(4);
        playerCustomer.setFlipX(true); // 水平翻转
        playerCustomer.setDepth(2);
        
       

        // 创建经营游戏UI
        this.createGameUI();
        
        // 创建顾客队列区域
        this.createCustomerQueue();
        
        // 创建订单面板
        this.createOrdersPanel();
        
        // Load game state if it exists
        if (this.registry.get('gameStateSaved')) {
            console.log('发现已保存的游戏状态，正在加载...');
            this.loadState();
        }

        // NOW, process any completed order that was passed in
        if (this.orderToProcessOnCreate) {
            console.log(`正在处理已完成的订单: ${this.orderToProcessOnCreate.id}`);
            this.completeOrder(this.orderToProcessOnCreate);
            this.orderToProcessOnCreate = null; // Reset after processing
        }

        // 开始游戏按钮
         //按钮
         const buttonX = this.cameras.main.width - 150; // 距离右边150像素
         const buttonY = this.cameras.main.height - 50; // 距离底部100像素
        const startGameButton = CommonFunction.createButton(
            this,
            buttonX,
            buttonY,
            'button-normal',
            'button-pressed',
            '🎮 开始营业',
            10,
            () => this.startBusiness(),
            true,
            0.8
        );

        // 创建动画 
        this.anims.create({
            key: 'female-walk-down',
            frames: this.anims.generateFrameNumbers('female-customer', { start: 0, end: 8 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'female-walk-left',
            frames: this.anims.generateFrameNumbers('female-customer', { start: 9, end: 17 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'female-walk-right',
            frames: this.anims.generateFrameNumbers('female-customer', { start: 18, end: 23 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-down',
            frames: this.anims.generateFrameNumbers('player-customer', { start: 0, end: 8 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-left',
            frames: this.anims.generateFrameNumbers('player-customer', { start: 9, end: 17 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-right',
            frames: this.anims.generateFrameNumbers('player-customer', { start: 18, end: 23 }),
            frameRate: 6,
            repeat: -1
        });

        // // 播放动画 
        // femaleCustomer.play('female-walk-right');
        // playerCustomer.play('player-walk-left');
        
        EventBus.emit('current-scene-ready', this);
    }

    update(time: number, delta: number): void {
 
    }

    /**
     * 初始化菜单项
     */
    private initializeMenuItems(): void {
        this.menuItems = [
            { id: 'product_design', name: '产品设计', price: 1000, description: '定义需求和功能', icon: '📝', preparationTime: 5 },
            { id: 'visual_design', name: '视觉设计', price: 800, description: '设计UI和视觉稿', icon: '🎨', preparationTime: 4 },
            { id: 'frontend_dev', name: '前端开发', price: 1500, description: '实现用户界面', icon: '💻', preparationTime: 8 },
            { id: 'backend_dev', name: '后端开发', price: 1500, description: '开发服务器和数据库', icon: '⚙️', preparationTime: 8 }
        ];
    }

    /**
     * 创建游戏UI
     */
    private createGameUI(): void {
        // 分数显示
        this.scoreDisplay = this.add.text(20, 20, '💰 项目预算: ¥0', {
            fontSize: '24px',
            color: '#FF6B35',
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei',
            stroke: '#FFFFFF',
            strokeThickness: 2
        });
        this.scoreDisplay.setDepth(200);
    }

    /**
     * 创建顾客队列区域
     */
    private createCustomerQueue(): void {
        this.customerQueue = this.add.container(200, 450);
        this.customerQueue.setDepth(100);
    }
    
    /**
     * Recreates the visual representation of customers from the state.
     */
    private redrawCustomers(): void {
        this.customers.forEach(customer => {
            if (customer.isActive) {
                const queueX = -50 + (customer.queuePosition * 150);
                const sprite = this.add.sprite(queueX, 0, 'female-customer', 0);
                sprite.setScale(4.5);
                sprite.setFlipX(true);
                sprite.setDepth(20);
                
                customer.sprite = sprite;
                this.customerQueue.add(sprite);
            }
        });
    }

    /**
     * 创建订单面板
     */
    private createOrdersPanel(): void {
        this.ordersPanel = this.add.container(this.cameras.main.width-180, 100);
        
        // 订单面板背景 - 高度调整为正好容纳两个大卡片
        const panelHeight = 550;
        const ordersBg = this.add.graphics();
        ordersBg.fillStyle(0xFFFFFF, 0.9);
        ordersBg.lineStyle(3, 0x8B4513, 1);
        ordersBg.fillRoundedRect(-150, -50, 300, panelHeight, 15);
        ordersBg.strokeRoundedRect(-150, -50, 300, panelHeight, 15);
        
        // 订单标题
        const ordersTitle = this.add.text(0, -30, '📋 需求池', {
            fontSize: '20px',
            color: '#8B4513',
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei'
        }).setOrigin(0.5);
        
        this.ordersPanel.add([ordersBg, ordersTitle]);
        this.ordersPanel.setDepth(150);
    }



    /**
     * 开始营业
     */
    private startBusiness(): void {
        if (this.isGameRunning) return;
        
        this.isGameRunning = true;
        this.gameTime = 0;
        this.gameScore = 0;
        
        CommonFunction.showToast(this, '项目启动！开始接收需求...', 2000, 'success');
        
        // 开始生成顾客
        this.customerSpawnTimer = this.time.addEvent({
            delay: 8000, // 每8秒生成一个顾客
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });
        

        
        // 立即生成第一个顾客
        this.spawnCustomer();
    }

    /**
     * 生成新顾客
     */
    private spawnCustomer(): void {
        if (this.customers.length >= this.maxCustomers) return;
        
        const customerName = this.customerNames[Math.floor(Math.random() * this.customerNames.length)];
        const customerId = `customer_${this.customerCounter++}`;
        
        // 先来的在右边，后来的在左边
        const queuePosition = this.maxCustomers - 1 - this.customers.length;
        const targetX = 200 + queuePosition * 220;
        const startX = -100; // 从左边屏幕外入场

        // 创建顾客精灵
        const customerSprite = this.add.sprite(startX, 550, 'female-customer', 0);
        customerSprite.setScale(4.5);
        customerSprite.setDepth(110);
        
        // 生成随机订单
        const order = this.generateRandomOrder(customerId, customerName);
        
        const customer: Customer = {
            id: customerId,
            name: customerName,
            sprite: customerSprite,
            order: order,
            position: { x: targetX, y: 550 },
            queuePosition: queuePosition,
            isActive: true,
            mood: 'neutral'
        };
        
        this.customers.push(customer);
        this.customerOrders.push(order);
        
        // 显示顾客到达提示
        CommonFunction.showToast(this, `新需求来自: ${customerName}`, 1500, 'info');
        
        // 更新订单显示
        this.updateOrdersDisplay();
        
        // 顾客入场动画
        customerSprite.play('female-walk-right');
        this.tweens.add({
            targets: customerSprite,
            x: targetX,
            duration: 2500, // 动画时间
            ease: 'Linear',
            onComplete: () => {
                customerSprite.stop();
                customerSprite.setFrame(0); // 设置为站立帧
            }
        });
    }

    /**
     * 生成随机订单
     */
    private generateRandomOrder(customerId: string, customerName: string): CustomerOrder {
        const orderItems: { item: MenuItem; quantity: number; status: 'pending' | 'completed' }[] = [];
        let totalOrderPrice = 0;
        let totalDevTime = 0;

        // Ensure every order is a full project with all 4 items
        this.menuItems.forEach(item => {
            const quantity = 1; // Each task is a single unit
            orderItems.push({ item: item, quantity: quantity, status: 'pending' });
            totalOrderPrice += item.price * quantity;
            totalDevTime += item.preparationTime * quantity;
        });

        // Calculate DDL based on complexity (total dev time)
        const ddl = totalDevTime + Math.floor(Math.random() * 5) + 3; // DDL = 开发时间 + 3-7天缓冲

        return {
            id: `order_${this.orderCounter++}`,
            customerId,
            customerName,
            items: orderItems,
            total: totalOrderPrice,
            status: 'waiting',
            orderTime: new Date(),
            ddl: ddl,
            totalDevTime: totalDevTime,
            preparationProgress: 0
        };
    }

    /**
     * 更新订单显示
     */
    private updateOrdersDisplay(): void {
        // 清除现有的订单显示
        this.ordersPanel.each((child: any) => {
            if (child.isOrderItem) {
                child.destroy();
            }
        });
        
        // 显示所有待处理订单
        this.customerOrders.forEach((order, index) => {
            if (order.status === 'waiting' || order.status === 'preparing') {
                const cardHeight = 250;
                const spacing = 20;
                const orderY = -30 + (cardHeight / 2) + (index * (cardHeight + spacing));
                this.createOrderDisplay(order, orderY);
            }
        });
    }

    /**
     * 创建单个订单显示
     */
    private createOrderDisplay(order: CustomerOrder, y: number): void {
        const orderContainer = this.add.container(0, y);
        (orderContainer as any).isOrderItem = true;
        
        // 订单背景 - 增加高度
        const cardHeight = 250;
        const orderBg = this.add.graphics();
        orderBg.fillStyle(order.status === 'preparing' ? 0xFFE4B5 : 0xF0F8FF, 0.8);
        orderBg.lineStyle(2, order.status === 'preparing' ? 0xFF8C00 : 0x4682B4, 1);
        orderBg.fillRoundedRect(-135, -110, 270, cardHeight, 10);
        orderBg.strokeRoundedRect(-135, -110, 270, cardHeight, 10);
        
        // 顾客名字 - 上移
        const customerName = this.add.text(-125, -100, `👤 ${order.customerName}`, {
            fontSize: '16px',
            color: '#8B4513',
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei'
        });
        
        // 订单内容 - 调整位置并增加行间距
        const orderText = order.items.map(item => 
            `${item.item.icon} ${item.item.name} x${item.quantity}`
        ).join('\n');
        
        const orderContent = this.add.text(-125, -70, orderText, {
            fontSize: '14px',
            color: '#666666',
            fontFamily: 'Arial, SimHei, Microsoft YaHei',
            lineSpacing: 8
        });
        
        // 总价 - 上移
        const totalText = this.add.text(70, -100, `¥${order.total}`, {
            fontSize: '18px',
            color: '#FF6B35',
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei'
        });
        
        // DDL 倒计时显示
        const ddlColor = order.ddl > 5 ? '#4CAF50' : order.ddl > 2 ? '#FF9800' : '#F44336';
        const ddlText = this.add.text(0, 60, `DDL: 剩余 ${order.ddl} 天`, {
            fontSize: '18px',
            color: ddlColor,
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei',
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 制作按钮 - 居中放置在卡片底部
        const prepareButton = CommonFunction.createButton(
            this,
            0,
            115,
            'button-normal',
            'button-pressed',
            order.status === 'preparing' ? '开发中...' : '开始开发',
            1,
            () => this.startPreparation(order.id),
            false // 禁用悬停效果
        );
        prepareButton.setScale(0.6);
        
        if (order.status === 'preparing') {
            prepareButton.setAlpha(0.6);
        }
        
        orderContainer.add([orderBg, customerName, orderContent, totalText, ddlText, prepareButton]);
        this.ordersPanel.add(orderContainer);
    }

    /**
     * 点击“开始开发”按钮后调用的函数
     * @param orderId
     */
    private startPreparation(orderId: string): void {
        const order = this.customerOrders.find(o => o.id === orderId);
        if (!order) {
            console.error(`Order with id ${orderId} not found!`);
            return;
        }

        console.log(`准备进入开发小游戏，项目ID: ${order.id}`);
        // Save state before leaving
        this.saveState();
        
        // 启动制作场景，并传递订单信息
        this.scene.start('GameEntrance', { order: order });
    }

    /**
     * 完成订单，计算奖励
     */
    private completeOrder(orderToComplete: CustomerOrder): void {
        const order = this.customerOrders.find(o => o.id === orderToComplete.id);
        if (!order) {
            console.error(`Error: Could not find order ${orderToComplete.id} to complete.`);
            return;
        }

        order.status = 'served';

        CommonFunction.showToast(this, `项目 "${order.customerName}" 成功交付!`, 2500, 'success');

        // --- Calculate Bonus ---
        // Bonus is based on how many "days" are left on the DDL.
        const ddlBonus = Math.max(0, order.ddl) * 50; // 50 currency units per day left
        const finalPayment = order.total + ddlBonus;

        console.log(`项目 ${order.id} 完成. 基础预算: ${order.total}, DDL 奖励: ${ddlBonus}, 总计: ${finalPayment}`);

        this.gameScore += finalPayment;

        this.removeCustomer(order.customerId);
        
        // Remove the order itself
        const orderIndex = this.customerOrders.findIndex(o => o.id === order.id);
        if (orderIndex > -1) {
            this.customerOrders.splice(orderIndex, 1);
        }

        this.updateOrdersDisplay();
        this.updateScoreDisplay();

        // Since the order is now complete and we are back on the main screen,
        // we can clear the saved state to prevent reloading old data on next entry.
        this.registry.set('gameStateSaved', false);
    }

    /**
     * 移除顾客
     */
    private removeCustomer(customerId: string): void {
        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex > -1) {
            const customer = this.customers[customerIndex];
            
            // Play leaving animation before destroying
            if (customer.sprite) {
                const sprite = customer.sprite; // Create a local const to satisfy the linter
                this.tweens.add({
                    targets: sprite,
                    x: this.cameras.main.width + 200, // Move off-screen to the right
                    duration: 1500,
                    ease: 'Power2',
                    onStart: () => {
                        sprite.play('female-walk-right'); // Assuming 'walk-right' is the animation key
                    },
                    onComplete: () => {
                        sprite.destroy();
                    }
                });
            }

            this.customers.splice(customerIndex, 1);
            
            // 重新排列剩余顾客 - 先来的在右边，后来的在左边
            this.customers.forEach((customer, index) => {
                const newPosition = this.maxCustomers - 1 - index;
                customer.queuePosition = newPosition;
                this.tweens.add({
                    targets: customer.sprite,
                    x: 200 + newPosition * 220,
                    duration: 500,
                    ease: 'Power2'
                });
            });
        }
    }

    /**
     * 更新顾客耐心值
     */
    private updateCustomerPatience(): void {
        this.customerOrders.forEach(order => {
            if (order.status === 'waiting' || order.status === 'preparing') {
                order.ddl -= 1; // DDL 每天减少1
                
                if (order.ddl < 0) {
                    // DDL 超时
                    this.customerLeavesAngry(order);
                }
            }
        });
        
        this.updateOrdersDisplay();
    }

    /**
     * 顾客愤怒离开
     */
    private customerLeavesAngry(order: CustomerOrder): void {
        if (!order) return;
        
        CommonFunction.showToast(this, `项目 ${order.customerName} 已超时，客户非常不满！`, 3000, 'error');
        // No penalty for now, just logging
        console.log(`项目 ${order.customerName} (ID: ${order.id}) DDL爆炸，预算扣除!`);
        this.gameScore -= order.total / 2; // Simple penalty

        order.status = 'expired';
        this.removeCustomer(order.customerId);
        this.updateOrdersDisplay();
        this.updateScoreDisplay();
    }

    /**
     * 更新分数显示
     */
    private updateScoreDisplay(): void {
        this.scoreDisplay.setText(`💰 项目预算: ¥${this.gameScore}`);
    }

    /**
     * 更新游戏时间
     */
    private updateGameTime(): void {
        this.gameTime++;
        // The display part is removed, but time still needs to tick for game logic.
        // For example, if DDLs are based on gameTime in the future.
    }
    
    private startGame() {
        this.scene.start('GameEntrance');
    }

    private saveState(): void {
        const customersToSave = this.customers.map(c => {
            const { sprite, ...customerData } = c; // Exclude sprite
            return customerData;
        });

        this.registry.set('gameStateSaved', true);
        this.registry.set('isGameRunning', this.isGameRunning);
        this.registry.set('gameScore', this.gameScore);
        this.registry.set('gameTime', this.gameTime);
        this.registry.set('orderCounter', this.orderCounter);
        this.registry.set('customerCounter', this.customerCounter);
        this.registry.set('customerOrders', this.customerOrders);
        this.registry.set('customers', customersToSave);
        console.log('游戏状态已保存。');
    }

    private loadState(): void {
        this.isGameRunning = this.registry.get('isGameRunning');
        this.gameScore = this.registry.get('gameScore');
        this.gameTime = this.registry.get('gameTime');
        this.orderCounter = this.registry.get('orderCounter');
        this.customerCounter = this.registry.get('customerCounter');
        this.customerOrders = this.registry.get('customerOrders');
        this.customers = this.registry.get('customers');

        this.updateScoreDisplay();
        this.updateGameTime();
        this.updateOrdersDisplay();
        this.redrawCustomers();
        if (this.isGameRunning) { // Only resume business if it was running
            this.resumeBusiness();
        }
        console.log('游戏状态已加载。');
    }

    private resumeBusiness(): void {
        if (this.customerSpawnTimer) {
            this.customerSpawnTimer.destroy();
        }
        
        // Restart spawning customers
        this.customerSpawnTimer = this.time.addEvent({
            delay: 8000,
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });
    }
}
