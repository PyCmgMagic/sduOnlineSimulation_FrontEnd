import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameObjects } from "phaser";
import { CommonFunction } from "../../utils/CommonFunction.ts";
import GameApiService, { GameOrder } from "../../utils/gameApi";

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
    private readonly CUSTOMER_QUEUE_START_X: number = 700;
    private readonly CUSTOMER_QUEUE_SPACING: number = 220;
    private readonly CUSTOMER_Y_POSITION: number = 440;

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

    // API相关状态
    private currentApiOrder: GameOrder | null = null;
    private isApiEnabled: boolean = true; // 是否启用API调用

    // Timers
    private customerSpawnTimer: Phaser.Time.TimerEvent | null;
    private dayTimer: Phaser.Time.TimerEvent | null;

    // UI Elements
    private ordersPanel: GameObjects.Container;
    private scoreDisplay: GameObjects.Text;

    // Data Pools
    private customerNames: string[] = [
      '阿里巴巴', '腾讯', '京东', '百度', '字节跳动', '美团', '滴滴', '快手', '拼多多', '携程','网易','山东大学'
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
            { id: 'backend_dev', name: '后端开发', price: 1500, description: '开发服务器和数据库', icon: '⚙️', preparationTime: 8 },
            { id: 'mobile_dev', name: '移动端开发', price: 1400, description: '适配主流分辨率与刘海屏', icon: '📱', preparationTime: 7 }
        ];
    }

    /**
     * 创建游戏世界背景和角色
     * 使用order-bg作为背景图片，并添加玩家角色
     */
    private createWorld(): void {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // 添加order-bg背景图片
        const background = this.add.image(centerX, centerY, 'order-bg');
        background.setOrigin(0.5, 0.5);

        // 获取背景图片尺寸并计算缩放比例以适配屏幕
        const bgTexture = this.textures.get('order-bg');
        const scaleX = this.cameras.main.width / bgTexture.source[0].width;
        const scaleY = this.cameras.main.height / bgTexture.source[0].height;
        const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保完全覆盖

        background.setScale(scale).setDepth(0);

        // 添加玩家角色
        const playerCustomer = this.add.image(440, 550, 'ShopStaff');
        playerCustomer.setScale(0.6).setDepth(11);

        // 添加bar元素到屏幕下方
        const barY = this.cameras.main.height - 120;
        const bar = this.add.image(centerX, barY, 'bar');
        bar.setOrigin(0.5, 0.5);

        // 计算bar的缩放比例以适配屏幕宽度
        const barTexture = this.textures.get('bar');
        const barScaleX = this.cameras.main.width / barTexture.source[0].width;
        bar.setScale(barScaleX, 1).setDepth(10);
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
        // 为customer1创建简单的动画（使用不同帧）
        const customer1Anims = [
            { key: 'customer1-idle', start: 4, end: 4 },
            { key: 'customer1-walk-right', start: 0, end: 4 },
            { key: 'customer1-walk-left', start: 0, end: 3 },
            { key: 'customer1-happy', start: 4, end: 4 }
        ];

        customer1Anims.forEach(anim => {
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers('customer1', { start: anim.start, end: anim.end }),
                frameRate: 3,
                repeat: -1
            });
        });

        // 保留玩家动画
        const playerAnims = [
            { key: 'player-walk-down', start: 0, end: 8 },
            { key: 'player-walk-left', start: 9, end: 17 },
            { key: 'player-walk-right', start: 18, end: 23 }
        ];

        playerAnims.forEach(anim => {
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers('player-customer', { start: anim.start, end: anim.end }),
                frameRate: 6,
                repeat: -1
            });
        });
    }

    // --- API DATA CONVERSION ---

    /**
     * 将API订单数据转换为游戏内部订单格式
     */
    private convertApiOrderToGameOrder(apiOrder: GameOrder): CustomerOrder {
        // 转换items格式
        const orderItems = apiOrder.items.map(apiItem => ({
            item: {
                id: apiItem.item.id,
                name: apiItem.item.name,
                description: apiItem.item.description,
                price: Math.floor(apiOrder.price / apiOrder.items.length), // 平均分配价格
                category: this.getCategoryByItemId(apiItem.item.id),
                icon: this.getIconByItemId(apiItem.item.id)
            },
            quantity: 1,
            status: apiItem.status === 'pending' ? 'pending' as const : 'completed' as const,
            difficulty: apiItem.difficulty
        }));

        // 创建游戏订单
        const gameOrder: CustomerOrder = {
            id: apiOrder.id.toString(),
            customerId: apiOrder.customerId,
            customerName: apiOrder.customerName,
            items: orderItems,
            total: apiOrder.price,
            status: this.convertApiStatus(apiOrder.status),
            orderTime: new Date(apiOrder.orderTime),
            ddl: Math.max(1, Math.floor(apiOrder.totalDevTime / 24) || 7), // 转换为天数，默认7天
            totalDevTime: apiOrder.totalDevTime || 168, // 默认168小时（7天）
            difficulty: Math.max(...apiOrder.items.map(item => item.difficulty)),
            preparationProgress: apiOrder.preparationProgress
        };

        return gameOrder;
    }

    /**
     * 根据item ID获取分类
     */
    private getCategoryByItemId(itemId: string): string {
        const categoryMap: Record<string, string> = {
            'product_design': '产品设计',
            'visual_design': '视觉设计',
            'frontend_dev': '前端开发',
            'backend_dev': '后端开发',
            'mobile_dev': '移动端开发'
        };
        return categoryMap[itemId] || '其他';
    }

    /**
     * 根据item ID获取图标
     */
    private getIconByItemId(itemId: string): string {
        const iconMap: Record<string, string> = {
            'product_design': '📝',
            'visual_design': '🎨',
            'frontend_dev': '💻',
            'backend_dev': '⚙️',
            'mobile_dev': '📱'
        };
        return iconMap[itemId] || '•';
    }

    /**
     * 转换API状态到游戏状态
     */
    private convertApiStatus(apiStatus: string): CustomerOrder['status'] {
        const statusMap: Record<string, CustomerOrder['status']> = {
            'pending': 'waiting',
            'preparing': 'preparing',
            'completed': 'served',
            'expired': 'expired'
        };
        return statusMap[apiStatus] || 'waiting';
    }

    // --- GAME FLOW & STATE ---

    private async startBusiness(): Promise<void> {
        if (this.isGameRunning) return;

        this.isGameRunning = true;
        this.gameScore = 0;

        // 清理上一局遗留的订单/客户与UI，避免出现额外条目（例如本地随机订单包含“移动端开发”）
        this.stopTimers();
        this.customerOrders = [];
        this.customers = [];
        this.orderCounter = 1;
        this.customerCounter = 1;

        // 清理保存的游戏状态，防止恢复旧的订单数据
        this.registry.set('gameStateSaved', false);
        this.registry.set('customerOrders', []);
        this.registry.set('customers', []);

        if (this.ordersPanel) {
            this.ordersPanel.removeAll(true);
        }
        this.updateOrdersDisplay?.();

        CommonFunction.showToast(this, '项目启动！开始接收需求...', 2000, 'success');

        // 如果启用API，调用begin接口
        if (this.isApiEnabled) {
            try {
                CommonFunction.showToast(this, '正在连接服务器...', 1500, 'info');
                this.currentApiOrder = await GameApiService.beginGame();
                console.log('🎮 游戏开始，获得订单:', this.currentApiOrder);
                CommonFunction.showToast(this, '服务器连接成功！', 1500, 'success');

                // 使用API返回的订单数据生成游戏订单
                if (this.currentApiOrder) {
                    const apiOrder = this.convertApiOrderToGameOrder(this.currentApiOrder);
                    this.customerOrders.push(apiOrder);
                    console.log('📋 使用API订单数据:', apiOrder);

                    // 更新UI显示
                    this.updateOrdersDisplay();
                    // API模式下不启动定时器，只使用API返回的订单
                    return; // 使用API数据，不再生成本地订单
                }
            } catch (error) {
                console.warn('⚠️ API调用失败，使用离线模式:', error);
                CommonFunction.showToast(this, '离线模式启动', 1500, 'warning');
                this.isApiEnabled = false; // 暂时禁用API
            }
        }

        // 只有在离线模式下才启动定时器和生成本地订单
        this.startTimers();
        this.spawnCustomer();
    }

    private resumeBusiness(): void {
        if (this.isGameRunning) {
            // 只有在离线模式下才启动定时器
            if (!this.isApiEnabled || !this.currentApiOrder) {
                this.startTimers();
            }
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

    private async completeOrder(orderToComplete: CustomerOrder): Promise<void> {
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

        // 如果启用API且有当前订单，调用update-game-status接口
        if (this.isApiEnabled && this.currentApiOrder) {
            try {
                CommonFunction.showToast(this, '正在同步游戏进度...', 1500, 'info');

                // 准备更新数据（orderTime 使用 ISO_LOCAL_DATE_TIME，无时区/无偏移；毫秒可选）
                const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);
                const pad3 = (n: number) => (n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n);
                const formatIsoLocal = (d: Date) => {
                    const base = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
                    const ms = d.getMilliseconds();
                    return ms ? `${base}.${pad3(ms)}` : base;
                };

                const updateData = {
                    items: JSON.stringify(orderToComplete.items),
                    total: finalPayment,
                    status: 'completed',
                    orderTime: formatIsoLocal(new Date()),
                    totalDevTime: order.totalDevTime,
                    preparationProgress: 100
                };

                const updatedOrder = await GameApiService.updateGameStatus(
                    this.currentApiOrder.id,
                    updateData
                );

                console.log('✅ 游戏状态同步成功:', updatedOrder);
                CommonFunction.showToast(this, '进度同步成功！', 1500, 'success');

                // 更新本地的API订单数据
                this.currentApiOrder = updatedOrder;

            } catch (error) {
                console.warn('⚠️ 游戏状态同步失败:', error);
                CommonFunction.showToast(this, '进度同步失败，但游戏继续', 2000, 'warning');
            }
        }

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

        // 新顾客排在队列的最右侧（最后面）
        const newCustomerIndex = this.customers.length;
        const newQueuePosition = newCustomerIndex; // 直接使用索引作为队列位置

        const customerName = this.customerNames[Math.floor(Math.random() * this.customerNames.length)];
        const customerId = `customer_${this.customerCounter++}`;
        const targetX = this.CUSTOMER_QUEUE_START_X + newQueuePosition * this.CUSTOMER_QUEUE_SPACING;
        const startX = this.cameras.main.width + 100; // 从屏幕右侧开始

        const customerSprite = this.add.sprite(startX, this.CUSTOMER_Y_POSITION, 'customer1', 0);
        // 由于customer1的尺寸是1080x1920，需要大幅缩小
        customerSprite.setScale(0.22).setDepth(8);

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

        customerSprite.play('customer1-walk-left');
        this.tweens.add({
            targets: customerSprite,
            x: targetX,
            duration: 5000,
            ease: 'Linear',
            onComplete: () => {
                customerSprite.stop();
                customerSprite.play('customer1-idle');
                // 动画播放完成后只显示该顾客的订单内容
                this.addSingleOrderDisplay(order);
            }
        });
    }

    /**
     * 移除顾客并播放向左离开的动画
     * @param customerId 要移除的顾客ID
     */
    private removeCustomer(customerId: string): void {
        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex > -1) {
            const customer = this.customers[customerIndex];
            if (customer.sprite) {
                const sprite = customer.sprite;
                this.tweens.add({
                    targets: sprite,
                    x: -200, // 向左移动到屏幕外
                    duration: 5000,
                    ease: 'Power2',
                    onStart: () => {
                        sprite.play('customer1-walk-left'); // 播放向左走的动画
                    },
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
            const newQueuePosition = index; // 直接使用数组索引作为队列位置

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
                const sprite = this.add.sprite(queueX, this.CUSTOMER_Y_POSITION, 'customer1', 0);
                // 由于customer1的尺寸是1080x1920，需要大幅缩小
                sprite.setScale(0.22).setDepth(8);
                sprite.play('customer1-idle');
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

/**
 * 添加单个订单显示
 * @param order 要显示的订单
 */
private addSingleOrderDisplay(order: CustomerOrder): void {
    // 筛选出所有状态为 'waiting' 或 'preparing' 的活动订单
    const ordersToDisplay = this.customerOrders.filter(
        o => o.status === 'waiting' || o.status === 'preparing'
    );

    // 找到当前订单在显示列表中的索引
    const orderIndex = ordersToDisplay.findIndex(o => o.id === order.id);
    if (orderIndex === -1) return;

    const cardHeight = 250;
    const spacing = 20;
    const orderY = -30 + (cardHeight / 2) + (orderIndex * (cardHeight + spacing));

    this.createOrderDisplay(order, orderY);
}

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
