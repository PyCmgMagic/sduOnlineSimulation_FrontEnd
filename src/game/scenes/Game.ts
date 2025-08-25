import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameObjects } from "phaser";
import { CommonFunction } from "../../utils/CommonFunction.ts";

// --- INTERFACES ---

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
    difficulty: number; // 难度系数 (1-10)
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

// --- MAIN GAME SCENE ---

export class Game extends Scene
{
    // --- PROPERTIES ---

    // Game Constants
    private readonly MAX_CUSTOMERS: number = 2;
    private readonly CUSTOMER_SPAWN_DELAY: number = 4000; // ms
    private readonly DAY_DURATION: number = 5000; // ms
    private readonly CUSTOMER_QUEUE_START_X: number = 200;
    private readonly CUSTOMER_QUEUE_SPACING: number = 220;
    private readonly CUSTOMER_Y_POSITION: number = 550;
    
    // Scene Objects
    private camera: Phaser.Cameras.Scene2D.Camera;
    
    // Game State
    private isGameRunning: boolean = false;
    private gameScore: number = 0;
    private menuItems: MenuItem[] = [];
    private customers: Customer[] = [];
    private customerOrders: CustomerOrder[] = [];
    private orderCounter: number = 1;
    private customerCounter: number = 1;
    private orderToProcessOnCreate: CustomerOrder | null = null;
    
    // Timers
    private customerSpawnTimer: Phaser.Time.TimerEvent | null;
    private dayTimer: Phaser.Time.TimerEvent | null;
    
    // UI Elements
    private ordersPanel: GameObjects.Container;
    private scoreDisplay: GameObjects.Text;
    
    // Data Pools
    private customerNames: string[] = [
      '天使投资人', '李响','抠门的老板'
    ];

    constructor ()
    {
        super('Game');
        this.initializeMenuItems();
    }
    
    // --- PHASER SCENE LIFECYCLE ---

    init(data: { completedOrder?: CustomerOrder }) {
        if (data && data.completedOrder) {
            console.log(`订单 ${data.completedOrder.id} 已被标记为待处理。`);
            this.orderToProcessOnCreate = data.completedOrder;
        }
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.cameras.main.setBackgroundColor('#87CEEB');

        this.createWorld();
        this.createGameUI();
        this.createOrdersPanel();
        this.createAnimations();
        
        // Load game state if it exists from a previous session
        if (this.registry.get('gameStateSaved')) {
            console.log('发现已保存的游戏状态，正在加载...');
            this.loadState();
        }

        // Process any order completed in a minigame scene
        if (this.orderToProcessOnCreate) {
            console.log(`正在处理已完成的订单: ${this.orderToProcessOnCreate.id}`);
            this.completeOrder(this.orderToProcessOnCreate);
            this.orderToProcessOnCreate = null;
        }

        // Add main 'Start Business' button
        CommonFunction.createButton(
            this,
            this.cameras.main.width - 150,
            this.cameras.main.height - 50,
            'button-normal',
            'button-pressed',
            '🎮 开始营业',
            10,
            () => this.startBusiness(),
            true,
            0.8
        );
        
        EventBus.emit('current-scene-ready', this);
    }

    // --- SETUP AND UI CREATION ---

    private initializeMenuItems(): void {
        this.menuItems = [
            { id: 'product_design', name: '产品设计', price: 1000, description: '定义需求和功能', icon: '📝', preparationTime: 5 },
            { id: 'visual_design', name: '视觉设计', price: 800, description: '设计UI和视觉稿', icon: '🎨', preparationTime: 4 },
            { id: 'frontend_dev', name: '前端开发', price: 1500, description: '实现用户界面', icon: '💻', preparationTime: 8 },
            { id: 'backend_dev', name: '后端开发', price: 1500, description: '开发服务器和数据库', icon: '⚙️', preparationTime: 8 }
        ];
    }
    
    private createWorld(): void {
        const centerX = this.cameras.main.width / 2;
        const cafeScale = 4;
        const wall = this.add.image(centerX, 0, 'houseBeige');
        wall.setOrigin(0.5, 0);
        const wallImage = this.textures.get('houseBeige');
        const scaleX = this.cameras.main.width / wallImage.source[0].width;
        wall.setScale(scaleX, cafeScale * 1.35).setDepth(1);

        const wall2Y = wall.y + wall.displayHeight;
        const wall2 = this.add.image(centerX, wall2Y, 'houseDark');
        wall2.setOrigin(0.5, 0);
        const wallImage2 = this.textures.get('houseDark');
        const scaleX2 = this.cameras.main.width / wallImage2.source[0].width;
        wall2.setScale(scaleX2, cafeScale * 0.45).setDepth(1);

        const wall3Y = wall2.y + wall2.displayHeight;
        const wall3 = this.add.image(centerX, wall3Y, 'houseGray');
        wall3.setOrigin(0.5, 0);
        const wallImage3 = this.textures.get('houseGray');
        const scaleX3 = this.cameras.main.width / wallImage3.source[0].width;
        wall3.setScale(scaleX3, cafeScale * 1.3).setDepth(3);

        const playerCustomer = this.add.sprite(600, 400, 'player-customer', 0);
        playerCustomer.setScale(4).setFlipX(true).setDepth(2);
    }
    
    private createGameUI(): void {
        this.scoreDisplay = this.add.text(20, 20, '💰 学线币: ¥0', {
            fontSize: '24px',
            color: '#FF6B35',
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei',
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setDepth(200);
    }

    private createOrdersPanel(): void {
        this.ordersPanel = this.add.container(this.cameras.main.width-180, 100);
        
        const panelHeight = 570;
        const ordersBg = this.add.graphics();
        ordersBg.fillStyle(0xFFFFFF, 0.9);
        ordersBg.lineStyle(3, 0x8B4513, 1);
        ordersBg.fillRoundedRect(-150, -50, 300, panelHeight, 15);
        ordersBg.strokeRoundedRect(-150, -50, 300, panelHeight, 15);
        
        const ordersTitle = this.add.text(0, -30, '📋 需求池', {
            fontSize: '20px',
            color: '#8B4513',
            fontFamily: 'Arial Bold, SimHei, Microsoft YaHei'
        }).setOrigin(0.5);
        
        this.ordersPanel.add([ordersBg, ordersTitle]).setDepth(150);
    }

    private createAnimations(): void {
        const anims = [
            { key: 'female-walk-down', start: 0, end: 8 },
            { key: 'female-walk-left', start: 9, end: 17 },
            { key: 'female-walk-right', start: 18, end: 23 },
            { key: 'player-walk-down', start: 0, end: 8 },
            { key: 'player-walk-left', start: 9, end: 17 },
            { key: 'player-walk-right', start: 18, end: 23 }
        ];

        anims.forEach(anim => {
            const texture = anim.key.includes('female') ? 'female-customer' : 'player-customer';
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers(texture, { start: anim.start, end: anim.end }),
                frameRate: 6,
                repeat: -1
            });
        });
    }

    // --- GAME FLOW & STATE ---

    private startBusiness(): void {
        if (this.isGameRunning) return;
        
        this.isGameRunning = true;
        this.gameScore = 0;
        
        CommonFunction.showToast(this, '项目启动！开始接收需求...', 2000, 'success');
        
        this.startTimers();
        this.spawnCustomer();
    }

    private resumeBusiness(): void {
        if (this.isGameRunning) {
            this.startTimers();
        }
    }
    
    private startPreparation(orderId: string): void {
        const order = this.customerOrders.find(o => o.id === orderId);
        if (!order) {
            console.error(`Order with id ${orderId} not found!`);
            return;
        }

        console.log(`准备进入开发小游戏，项目ID: ${order.id}`);
        this.stopTimers();
        this.saveState();
        
        this.scene.start('GameEntrance', { order: order });
    }

    private completeOrder(orderToComplete: CustomerOrder): void {
        const order = this.customerOrders.find(o => o.id === orderToComplete.id);
        if (!order) {
            console.error(`Error: Could not find order ${orderToComplete.id} to complete.`);
            return;
        }

        order.status = 'served';
        CommonFunction.showToast(this, `项目 "${order.customerName}" 成功交付!`, 2500, 'success');

        const ddlBonus = Math.max(0, order.ddl) * 50;
        const finalPayment = order.total + ddlBonus;
        console.log(`项目 ${order.id} 完成. 基础预算: ${order.total}, DDL 奖励: ${ddlBonus}, 总计: ${finalPayment}`);

        this.gameScore += finalPayment;
        this.removeCustomer(order.customerId);
        
        const orderIndex = this.customerOrders.findIndex(o => o.id === order.id);
        if (orderIndex > -1) {
            this.customerOrders.splice(orderIndex, 1);
        }

        this.updateOrdersDisplay();
        this.updateScoreDisplay();

        this.registry.set('gameStateSaved', false);
    }

    // --- CUSTOMER MANAGEMENT ---

    private spawnCustomer(): void {
        if (this.customers.length >= this.MAX_CUSTOMERS) return;

        // The queue is packed from right to left.
        // The newest customer goes to the leftmost available spot.
        const newCustomerIndex = this.customers.length;
        const newQueuePosition = (this.MAX_CUSTOMERS - 1) - newCustomerIndex;

        const customerName = this.customerNames[Math.floor(Math.random() * this.customerNames.length)];
        const customerId = `customer_${this.customerCounter++}`;
        const targetX = this.CUSTOMER_QUEUE_START_X + newQueuePosition * this.CUSTOMER_QUEUE_SPACING;
        const startX = -100;

        const customerSprite = this.add.sprite(startX, this.CUSTOMER_Y_POSITION, 'female-customer', 0);
        customerSprite.setScale(4.5).setDepth(110);
        
        const order = this.generateRandomOrder(customerId, customerName);
        
        const customer: Customer = {
            id: customerId,
            name: customerName,
            sprite: customerSprite,
            order: order,
            position: { x: targetX, y: this.CUSTOMER_Y_POSITION },
            queuePosition: newQueuePosition,
            isActive: true,
            mood: 'neutral'
        };
        
        this.customers.push(customer);
        this.customerOrders.push(order);
        
        CommonFunction.showToast(this, `新需求来自: ${customerName}`, 1500, 'info');
        this.updateOrdersDisplay();
        
        customerSprite.play('female-walk-right');
        this.tweens.add({
            targets: customerSprite,
            x: targetX,
            duration: 2500,
            ease: 'Linear',
            onComplete: () => {
                customerSprite.stop();
                customerSprite.setFrame(0);
            }
        });
    }

    private removeCustomer(customerId: string): void {
        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex > -1) {
            const customer = this.customers[customerIndex];
            
            if (customer.sprite) {
                const sprite = customer.sprite;
                this.tweens.add({
                    targets: sprite,
                    x: this.cameras.main.width + 200,
                    duration: 1500,
                    ease: 'Power2',
                    onStart: () => sprite.play('female-walk-right'),
                    onComplete: () => {
                        sprite.destroy();
                        this.customers.splice(customerIndex, 1);
                        this.rearrangeCustomers();
                    }
                });
            } else {
                this.customers.splice(customerIndex, 1);
                this.rearrangeCustomers();
            }
        }
    }

    private rearrangeCustomers(): void {
        this.customers.forEach((customer, index) => {
            const newQueuePosition = (this.MAX_CUSTOMERS - 1) - index;
            
            if (customer.queuePosition !== newQueuePosition) {
                customer.queuePosition = newQueuePosition;
                if (customer.sprite) {
                    this.tweens.add({
                        targets: customer.sprite,
                        x: this.CUSTOMER_QUEUE_START_X + newQueuePosition * this.CUSTOMER_QUEUE_SPACING,
                        duration: 800,
                        ease: 'Power2'
                    });
                }
            }
        });
    }

    private redrawCustomers(): void {
        this.customers.forEach(customer => {
            if (customer.isActive) {
                const queueX = this.CUSTOMER_QUEUE_START_X + customer.queuePosition * this.CUSTOMER_QUEUE_SPACING;
                const sprite = this.add.sprite(queueX, this.CUSTOMER_Y_POSITION, 'female-customer', 0);
                sprite.setScale(4.5).setDepth(110);
                customer.sprite = sprite;
            }
        });
    }
    
    private customerLeavesAngry(order: CustomerOrder): void {
        if (!order) return;
        
        CommonFunction.showToast(this, `项目 ${order.customerName} 已超时，客户非常不满！`, 3000, 'error');
        console.log(`项目 ${order.customerName} (ID: ${order.id}) DDL爆炸，预算扣除!`);
        this.gameScore -= order.total / 2;

        order.status = 'expired';
        this.removeCustomer(order.customerId);
        this.updateOrdersDisplay();
        this.updateScoreDisplay();
    }
    
    private generateRandomOrder(customerId: string, customerName: string): CustomerOrder {
        const orderItems: { item: MenuItem; quantity: number; status: 'pending' | 'completed' }[] = [];
        let totalOrderPrice = 0;
        let totalDevTime = 0;

        this.menuItems.forEach(item => {
            const quantity = 1;
            orderItems.push({ item: item, quantity: quantity, status: 'pending' });
            totalOrderPrice += item.price * quantity;
            totalDevTime += item.preparationTime * quantity;
        });

        const ddl = totalDevTime + Math.floor(Math.random() * 5) + 3;

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
            preparationProgress: 0,
            difficulty: Math.floor(Math.random() * 10) + 1 // 随机难度系数 (1-10)
        };
    }
// --- UI & DATA UPDATES ---

private updateOrdersDisplay(): void {
    // 首先，移除所有旧的订单卡片UI
    this.ordersPanel.each((child: any) => {
        if (child.isOrderItem) {
            child.destroy();
        }
    });
    
    // 筛选出所有状态为 'waiting' 或 'preparing' 的活动订单
    const ordersToDisplay = this.customerOrders.filter(
        order => order.status === 'waiting' || order.status === 'preparing'
    );
    
    // 遍历筛选后的活动订单列表，并为它们创建显示卡片
    ordersToDisplay.forEach((order, index) => {
        const cardHeight = 250;
        const spacing = 20;
        // 使用筛选后列表的索引来计算Y轴位置，确保布局紧凑无间隙
        const orderY = -30 + (cardHeight / 2) + (index * (cardHeight + spacing));
        this.createOrderDisplay(order, orderY);
    });
}
    private createOrderDisplay(order: CustomerOrder, y: number): void {
        const orderContainer = this.add.container(0, y);
        (orderContainer as any).isOrderItem = true;
        
        const cardHeight = 250;
        const orderBg = this.add.graphics();
        orderBg.fillStyle(order.status === 'preparing' ? 0xFFE4B5 : 0xF0F8FF, 0.8);
        orderBg.lineStyle(2, order.status === 'preparing' ? 0xFF8C00 : 0x4682B4, 1);
        orderBg.fillRoundedRect(-135, -110, 270, cardHeight, 10);
        orderBg.strokeRoundedRect(-135, -110, 270, cardHeight, 10);
        
        const customerName = this.add.text(-125, -100, `👤 ${order.customerName}`, { fontSize: '16px', color: '#8B4513', fontFamily: 'Arial Bold, SimHei, Microsoft YaHei' });
        
        const orderText = order.items.map(item => `${item.item.icon} ${item.item.name} x${item.quantity}`).join('\n');
        const orderContent = this.add.text(-125, -70, orderText, { fontSize: '14px', color: '#666666', fontFamily: 'Arial, SimHei, Microsoft YaHei', lineSpacing: 8 });
        
        const totalText = this.add.text(70, -100, `¥${order.total}`, { fontSize: '18px', color: '#FF6B35', fontFamily: 'Arial Bold, SimHei, Microsoft YaHei' });
        
        const ddlColor = order.ddl > 5 ? '#4CAF50' : order.ddl > 2 ? '#FF9800' : '#F44336';
        const ddlText = this.add.text(0, 60, `DDL: 剩余 ${order.ddl} 天`, { fontSize: '18px', color: ddlColor, fontFamily: 'Arial Bold, SimHei, Microsoft YaHei', stroke: '#FFFFFF', strokeThickness: 2 }).setOrigin(0.5);
        
        const prepareButton = CommonFunction.createButton(
            this, 0, 115, 'button-normal', 'button-pressed',
            order.status === 'preparing' ? '开发中...' : '开始开发',
            1, () => this.startPreparation(order.id), false
        );
        prepareButton.setScale(0.6);
        
        if (order.status === 'preparing') {
            prepareButton.setAlpha(0.6);
        }
        
        orderContainer.add([orderBg, customerName, orderContent, totalText, ddlText, prepareButton]);
        this.ordersPanel.add(orderContainer);
    }
    
    private updateScoreDisplay(): void {
        this.scoreDisplay.setText(`💰 学线币: ¥${this.gameScore}`);
    }

    // --- TIMER & PATIENCE MANAGEMENT ---

    private startTimers(): void {
        this.stopTimers();
        
        this.customerSpawnTimer = this.time.addEvent({
            delay: this.CUSTOMER_SPAWN_DELAY,
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });

        this.dayTimer = this.time.addEvent({
            delay: this.DAY_DURATION,
            callback: this.updateCustomerPatience,
            callbackScope: this,
            loop: true
        });
    }

    private stopTimers(): void {
        if (this.customerSpawnTimer) {
            this.customerSpawnTimer.destroy();
            this.customerSpawnTimer = null;
        }
        if (this.dayTimer) {
            this.dayTimer.destroy();
            this.dayTimer = null;
        }
    }
    
    private updateCustomerPatience(): void {
        let needsUpdate = false;
        this.customerOrders.forEach(order => {
            if (order.status === 'waiting' || order.status === 'preparing') {
                order.ddl -= 1;
                needsUpdate = true;
                if (order.ddl < 0) {
                    this.customerLeavesAngry(order);
                }
            }
        });
        
        if (needsUpdate) {
            this.updateOrdersDisplay();
        }
    }

    // --- SAVE & LOAD ---

    private saveState(): void {
        const customersToSave = this.customers.map(c => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { sprite, ...customerData } = c;
            return customerData;
        });

        this.registry.set('gameStateSaved', true);
        this.registry.set('isGameRunning', this.isGameRunning);
        this.registry.set('gameScore', this.gameScore);
        this.registry.set('customerOrders', this.customerOrders);
        this.registry.set('customers', customersToSave);
        this.registry.set('orderCounter', this.orderCounter);
        this.registry.set('customerCounter', this.customerCounter);
        console.log('游戏状态已保存。');
    }

    private loadState(): void {
        this.isGameRunning = this.registry.get('isGameRunning');
        this.gameScore = this.registry.get('gameScore');
        this.customerOrders = this.registry.get('customerOrders');
        this.customers = this.registry.get('customers');
        this.orderCounter = this.registry.get('orderCounter');
        this.customerCounter = this.registry.get('customerCounter');

        this.updateScoreDisplay();
        this.updateOrdersDisplay();
        this.redrawCustomers();
        this.resumeBusiness();
    }
}
