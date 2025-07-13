import { GameObjects, Scene, Physics, Time } from "phaser";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
import {CustomerOrder} from "../Game.ts";

export class ProductGame extends Scene 
{
    private currentOrder: CustomerOrder;
    
    background: GameObjects.Image;
    bottle: GameObjects.Image; // 合成的瓶子区域
    player: SpriteWithDynamicBody;
    time_use: GameObjects.Text // time use
    time_use_number: number = 0;
    
    /* temp components before assets done */
    graphics : GameObjects.Graphics;
    platforms: Physics.Arcade.StaticGroup;
    pause_button: GameObjects.Container;
    
    /* events */
    timerEvent: Time.TimerEvent;
    
    
    constructor() 
    {
        super("ProductGame");
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('ProductGame received order:', this.currentOrder);
    }
    
    create()
    {
        this.background = CommonFunction.createBackground(this, 514, 384, 'background');
        
        // 调试：检查资源是否加载
        console.log('🔍 ProductGame 资源检查:');
        console.log('game-product-player 存在:', this.textures.exists('game-product-player'));
        console.log('game-product-platform 存在:', this.textures.exists('game-product-platform'));
        
        /* init the player */
        this.player = this.physics.add.sprite(514, 348 - 140, 'game-product-player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1.3)
        
        /* player move anim */
        this.anims.create({
            key: 'player-move-left',
            frames: this.anims.generateFrameNumbers('game-product-player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })
        this.anims.create({
            key: "player-move-right",
            frames: this.anims.generateFrameNumbers('game-product-player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        })
        this.anims.create({
            key: 'player-move-turn',
            frames: [{ key: 'game-product-player', frame: 4 }],
            frameRate: 20,
        })
        
        /* draw a Rect as game area */
        const rectWidth: number = 400;
        const rectHeight: number = 512;
        const rectX: number = 514 - rectWidth / 2; 
        const rectY: number = 768 - rectHeight;
        this.graphics = this.add.graphics();
        this.graphics.fillRect(rectX, rectY, rectWidth, rectHeight);
        this.graphics.fillStyle(0x808080, 0.5);
        this.graphics.lineStyle(2, 0x000000, 0.8);
        this.graphics.strokeRect(rectX, rectY, rectWidth, rectHeight);

        /* platform at the upper line of the rectangle */
        this.platforms = this.physics.add.staticGroup();
        const platform_down = this.platforms.create(rectX+ rectWidth / 2, rectY, 'game-product-platform');
        platform_down.setScale(rectWidth / platform_down.width, 2 / platform_down.height).refreshBody();
        platform_down.visible = false;
        
        const platform_left = this.platforms.create(rectX, rectY, 'game-product-platform');
        platform_left.setScale(2 / platform_left.width, 2).refreshBody();
        platform_left.visible = false;
        
        const platform_right = this.platforms.create(rectX + rectWidth, rectY, 'game-product-platform');
        platform_right.setScale(2 / platform_right.width, 2).refreshBody();
        platform_right.visible = false;
        
        /* Collision detection */
        this.physics.add.collider(this.platforms, this.player);
        
        /* the timer */
        this.time_use = this.add.text(10, 400, `Time used: \n ${this.time_use_number}`, {
            fontSize: "24px",
            color: '#ffffff'
        });
        
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.incrementTimer,
            callbackScope: this,
            loop: true
        });
        
        /* pause */
        this.pause_button = CommonFunction.createButton(this, 120, 30, 'button-normal', 'button-pressed', 'Pause', 10, () => {
            this.scene.pause();
            this.scene.launch('PauseMenu', { callerScene: this.scene.key });
            this.pause_button.setVisible(false);
        })
        
        this.events.on('resume-game', () => {
            this.pause_button.setVisible(true);
        })
        
        // Add a complete button
        CommonFunction.createButton(this, 120, 100, 'button-normal', 'button-pressed', '完成设计', 10, () => {
            console.log('产品设计完成，返回开发中心');
            
            // Find the product_design item in the order and mark it as completed
            const productDesignTask = this.currentOrder.items.find(item => item.item.id === 'product_design');
            if (productDesignTask) {
                productDesignTask.status = 'completed';
                console.log(`任务 ${productDesignTask.item.name} 已标记为完成`);
            }
            
            this.scene.start('GameEntrance', { order: this.currentOrder });
        });
    }
    
    update()
    {
        /* player move */
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const cursors: CursorKeys = this.input.keyboard.createCursorKeys();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const key_D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const key_A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        
        if (cursors.left.isDown || key_A.isDown) {
            this.player.setVelocityX(-160)
            if (this.anims.exists('player-move-left')) {
                this.player.anims.play('player-move-left', true);
            }
        } else if(cursors.right.isDown || key_D.isDown) {
            this.player.setVelocityX(160)
            if (this.anims.exists('player-move-right')) {
                this.player.anims.play('player-move-right', true);
            }
        } else {
            this.player.setVelocityX(0);
            if (this.anims.exists('player-move-turn')) {
                this.player.anims.play('player-move-turn', true);
            }
        }
    }
    
    private incrementTimer() {
        this.time_use_number++;
        this.time_use.setText(`Time used: \n ${this.time_use_number}`);
    }
}