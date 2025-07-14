import { GameObjects, Scene, Physics, Time } from "phaser";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
import { CustomerOrder } from "../Game.ts";

export class ProductGame extends Scene 
{
    private currentOrder: CustomerOrder;
    /* const some key keyboard-key */
    Key_D: Phaser.Input.Keyboard.Key | undefined 
    Key_A: Phaser.Input.Keyboard.Key | undefined 
    Key_SPACE: Phaser.Input.Keyboard.Key | undefined ;
    
    /* base variable */
    background: GameObjects.Image;
    bottle: GameObjects.Image; // 合成的瓶子区域
    player: Physics.Matter.Sprite;
    time_use: GameObjects.Text // time use
    time_use_number: number = 0;
    player_move_speed: number = 2;
    
    /* temp components before assets done */
    graphics : GameObjects.Graphics;
    platforms: MatterJS.BodyType[];
    pause_button: GameObjects.Container;
    
    /* events */
    timerEvent: Time.TimerEvent;
    
    /* fruit game logical part */
    FRUITS_TYPES: string[] = ['game-product-fruit1', 'game-product-fruit1', 'game-product-fruit1']
    fruits: Physics.Matter.Sprite[] = []; // a group of fruits has placed
    dorpTimer: Time.TimerEvent;
    waitingForDorp: boolean = false;
    previewFruit: SpriteWithDynamicBody | null = null;
    currentFruit: Phaser.Physics.Matter.Sprite | null = null;
    private wasSpaceDown: undefined | boolean = false;
    private static readonly PLACED_FRUIT_GROUP = 1;
    private static readonly UNPLACED_FRUIT_GROUP = -2;
    
    constructor() 
    {
        super({
            key: "ProductGame",
            physics: {
                default: "matter",
                matter: {
                    gravity: {
                        y: 0.2,
                        x: 0
                    },
                    debug: true,
                },
            },
        });
    }
    
    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('ProductGame received order:', this.currentOrder);
    }

    preload() {
        this.load.image('game-product-fruit1', 'assets/games/product/ball.png');
    }
    
    create()
    {
        this.background = CommonFunction.createBackground(this, 514, 384, 'background');
        
        /* Check if the assets exist */
        console.log('🔍 ProductGame 资源检查:');
        console.log('game-product-player 存在:', this.textures.exists('game-product-player'));
        console.log('game-product-platform 存在:', this.textures.exists('game-product-platform'));
        
        /* init keys */
        this.Key_D = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.Key_SPACE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        this.Key_A = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        
        /* the timer init */
        this.initTimer();
        
        /* init the pause event */
        this.initPause();
        
        /* init the player */
        this.player = this.matter.add.sprite(514, 348 - 140, 'game-product-player', 4, {
            isStatic: false,
            friction: 0,
            collisionFilter: {
                category: 0x0008,
                mask: 0x0004
            }
        });
        this.player.setScale(1.3);
        this.player.setFixedRotation()
        
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

        /* boundary */
        this.platforms = [
            this.matter.add.rectangle(rectX, rectY + rectHeight / 2 - 50, 2, rectHeight + 100, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                }
        }),
            this.matter.add.rectangle(rectX + rectWidth, rectY + rectHeight / 2 - 50, 2, rectHeight + 100, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                category: 0x0004,
                mask: 0x0001 | 0x0002 | 0x0008
            }    
        }), 
            this.matter.add.rectangle(rectX + rectWidth / 2, rectY, rectWidth, 2, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                }
            }),
            this.matter.add.rectangle(rectX + rectWidth / 2, rectY + rectHeight, rectWidth, 2, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                }
            })
        ];
        
        
        /* init the game core logical part */
        this.generateNewFruit();
        
        

        /* Collision detection */
        this.matter.world.add(this.platforms)
        // this.physics.add.collider(this.fruits, this.fruits, this.syntheticFruits, this.isFruitSame, this);
        this.matter.world.on('collisionstart', 
            (event: Phaser.Physics.Matter.Events.CollisionStartEvent,) => 
            {
                event.pairs.forEach(pairs => {
                    
                    const bodyA = pairs.bodyA.gameObject as Physics.Matter.Sprite | null;
                    const bodyB = pairs.bodyB.gameObject as Physics.Matter.Sprite | null;

                    if (bodyA != null && bodyB != null && this.isFruitSame(bodyA, bodyB)) {
                        console.log('collision started');
                        this.syntheticFruits(bodyA, bodyB);
                    }
                })
            
        })
        
        CommonFunction.createButton(this, 120, 90, 'button-normal', 'button-pressed', '完成产品', 10, () => {
            console.log('产品开发完成，返回开发中心');

            const task = this.currentOrder.items.find(item => item.item.id === 'product_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
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
        
        if (cursors.left.isDown || this.Key_A?.isDown) {
            this.player.setVelocityX(-this.player_move_speed)
            if (this.anims.exists('player-move-left')) {
                this.player.anims.play('player-move-left', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(-this.player_move_speed)
            }
        } else if(cursors.right.isDown || this.Key_D?.isDown) {
            this.player.setVelocityX(this.player_move_speed)
            if (this.anims.exists('player-move-right')) {
                this.player.anims.play('player-move-right', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(this.player_move_speed)
            }
        } else {
            this.player.setVelocityX(0);
            if (this.anims.exists('player-move-turn')) {
                this.player.anims.play('player-move-turn', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(0)
            }
        }
        
        const isSpaceDown = this.Key_SPACE?.isDown;
        if (isSpaceDown && !this.wasSpaceDown && this.currentFruit) {
            this.placeFruits();
        }
        
        this.wasSpaceDown = isSpaceDown;
        
    }
    
    private incrementTimer() {
        this.time_use_number++;
        this.time_use.setText(`Time used: \n ${this.time_use_number}`);
    }
    
    private initTimer()
    {
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
    }
    
    private initPause()
    {
        /* pause */
        this.pause_button = CommonFunction.createButton(this, 120, 30, 'button-normal', 'button-pressed', 'Pause', 10, () => {
            this.scene.pause();
            this.scene.launch('PauseMenu', { callerScene: this.scene.key });
            this.pause_button.setVisible(false);
        })

        this.events.on('resume-game', () => {
            this.pause_button.setVisible(true);
        })
    }
    
    private generateNewFruit()
    {
        const randomNumber = Phaser.Math.Between(0,this.FRUITS_TYPES.length - 1)
        const randomType = this.FRUITS_TYPES[randomNumber];
        this.currentFruit = this.matter.add.sprite(this.player.x, this.player.y + 100, randomType, undefined, {
            shape: {
                type: 'circle',
                radius: 500 * (randomNumber + 1)
            },
            collisionFilter: {
                group: ProductGame.UNPLACED_FRUIT_GROUP,
                category: 0x0001,
                mask: 0x0001 | 0x0004
            },
            restitution: 0.2
        });
        this.currentFruit.setScale(100 / this.currentFruit.width);
        this.currentFruit.setAlpha(0.5);
        this.currentFruit.setData({ 'level': randomNumber })
        this.currentFruit.setIgnoreGravity(true)
        this.currentFruit.setFixedRotation()
        
        /* collider detection */
        // this.matter.world.add(this.platforms)
    }
    
    private placeFruits()
    {
        if (this.currentFruit) {
            this.currentFruit.setAlpha(1);
            this.currentFruit.setIgnoreGravity(false)
            this.fruits.push(this.currentFruit);
            this.currentFruit.setCollisionCategory(0x0002)
            this.currentFruit.setCollisionGroup(ProductGame.PLACED_FRUIT_GROUP)
            this.currentFruit.setCollidesWith(0x0002 | 0x0004)
            this.currentFruit.setFriction(0)
            this.currentFruit = null;
            
            this.generateNewFruit();
        }
    }
    
    private isFruitSame(obj1: Physics.Matter.Sprite, 
                        obj2: Physics.Matter.Sprite,): boolean 
    {
        if (!('getData' in obj1 ) || !("getData" in obj2)) {
            return false;
        }
        console.log('fruit same', obj1.getData('level'), obj2.getData('level'))
        return obj1.getData('level') === obj2.getData('level');
    }
    
    private syntheticFruits(obj1: Physics.Matter.Sprite, obj2: Physics.Matter.Sprite): void {
        console.log('synthetic fruits');
        const level: number = obj1.getData('level');
        if (level === this.FRUITS_TYPES.length - 1) {
            return;
        } else {
            const newLevelNumber: number = level + 1;
            const newFruitType = this.FRUITS_TYPES[newLevelNumber];
            const x: number = (obj1.x + obj2.x) / 2;
            const y: number = (obj1.y + obj2.y) / 2;
            
            const index1: number = this.fruits.indexOf(obj1);
            if (index1 > -1) {
                this.fruits.splice(index1, 1);
                obj1.destroy();
            }
            const index2: number = this.fruits.indexOf(obj2);
            if (index2 > -1) {
                this.fruits.splice(index2, 1);
                obj2.destroy();
            }
            
            const newFruit = this.matter.add.sprite(x, y, newFruitType, undefined, {
                shape: {
                    type: 'circle',
                    radius: 500 * (newLevelNumber + 1)
                },
                collisionFilter: {
                    group: ProductGame.PLACED_FRUIT_GROUP,
                    category: 0x0002,
                    mask: 0x0002 | 0x0004
                },
                restitution: 0.2
            });
            newFruit.setData({
                'level': newLevelNumber,
            });
            newFruit.setFriction(0);
            newFruit.setScale( 100 / newFruit.width);
            this.fruits.push(newFruit);
        }
    }
}