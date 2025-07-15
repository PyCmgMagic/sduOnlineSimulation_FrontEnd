import { GameObjects, Scene, Physics, Time } from "phaser";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
import { CustomerOrder } from "../Game.ts";

interface ProductOrder {
    DIFFICULTY: number;
}

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
    PLAYER_MOVE_SPEED: number[] = [4, 2, 2, 1, 1, 1, 1, 1];
    PROBABILITY_PER_DIFFICULTY: number[][] = [[0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0], [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0], [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0], [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0], [0.45, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.05], [0.4, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.1], [0.35, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.15], [0.3, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.2]];
    TARGET_LEVEL: number = 7;
    BAD_FRUIT_LEVEL: number = 8;
    
    /* temp components before assets done */
    graphics : GameObjects.Graphics;
    platforms: MatterJS.BodyType[];
    pause_button: GameObjects.Container;
    
    /* events */
    timerEvent: Time.TimerEvent;
    
    /* fruit game logical part */
    // 暂时定为8个水果加一个坏水果， 最后一个是坏水果
    FRUITS_TYPES: string[] = ['game-product-fruit1', 'game-product-fruit2', 'game-product-fruit3', 'game-product-fruit4', 'game-product-fruit5', 'game-product-fruit6', 'game-product-fruit7', 'game-product-fruit8', 'game-product-bad-fruit'];
    FRUITS_RADIUS: number[] = [500, 700, 900, 1100, 1300, 1500, 1700, 1900];
    BAD_FRUIT_RADIUS: number[] = [500, 600, 700, 800];
    fruits: Physics.Matter.Sprite[] = []; // a group of fruits has placed
    dorpTimer: Time.TimerEvent;
    waitingForDorp: boolean = false;
    previewFruit: SpriteWithDynamicBody | null = null;
    currentFruit: Phaser.Physics.Matter.Sprite | null = null;
    private wasSpaceDown: undefined | boolean = false;
    private static readonly PLACED_FRUIT_GROUP = 1;
    private static readonly UNPLACED_FRUIT_GROUP = -2;
    private static readonly MIN_PLACE_INTERVAL = 500;
    private lastPlaceTime: number = 0;
    
    /* difficulty level */
    DIFFICULTY: number = 0; // [0, 7]
    
    
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
    
    // 这里在游戏入口处将顾客订单分割，分别向四个游戏场景传递各自需要的数据？ 这里做了难度分级，不如让后端产生难度，然后前端根据难度进行游戏？
    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('ProductGame received order:', this.currentOrder);
    }

    preload() {
        this.load.image('game-product-fruit1', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit2', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit3', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit4', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit5', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit6', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit7', 'assets/games/product/ball.png');
        this.load.image('game-product-fruit8', 'assets/games/product/ball.png');
        this.load.image('game-product-bad-fruit', 'assets/games/product/ball.png');
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
        this.graphics.fillStyle(0x808080, 0.5);
        this.graphics.lineStyle(2, 0x000000, 0.8);
        this.graphics.strokeRect(rectX, rectY, rectWidth, rectHeight);
        this.graphics.fillRect(rectX, rectY, rectWidth, rectHeight);

        /* boundary */
        this.platforms = [
            // left, right, top, bottom
            this.matter.add.rectangle(rectX, rectY + rectHeight / 2 - 50, 2, rectHeight + 100, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                },
                render: {
                    visible: false
                },
                restitution: 1
        }),
            this.matter.add.rectangle(rectX + rectWidth, rectY + rectHeight / 2 - 50, 2, rectHeight + 100, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                },
                render: {
                    visible: false
                },
                restitution: 1
        }), 
            this.matter.add.rectangle(rectX + rectWidth / 2, rectY, rectWidth, 2, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                },
                render: {
                    visible: false
                },
                restitution: 0.2
            }),
            this.matter.add.rectangle(rectX + rectWidth / 2, rectY + rectHeight, rectWidth, 2, {
                isStatic: true, 
                label: 'boundary',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002 | 0x0008
                },
                render: {
                    visible: false
                },
                restitution: 0.2
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
            this.player.setVelocityX(0 - this.PLAYER_MOVE_SPEED[this.DIFFICULTY])
            if (this.anims.exists('player-move-left')) {
                this.player.anims.play('player-move-left', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(0 - this.PLAYER_MOVE_SPEED[this.DIFFICULTY])
            }
        } else if(cursors.right.isDown || this.Key_D?.isDown) {
            this.player.setVelocityX(this.PLAYER_MOVE_SPEED[this.DIFFICULTY])
            if (this.anims.exists('player-move-right')) {
                this.player.anims.play('player-move-right', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(this.PLAYER_MOVE_SPEED[this.DIFFICULTY])
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
        const currentTime = this.time.now;
        if (isSpaceDown && !this.wasSpaceDown && this.currentFruit) {
            if (currentTime - this.lastPlaceTime >= ProductGame.MIN_PLACE_INTERVAL ) {
                this.placeFruits()
                this.lastPlaceTime = currentTime;
            }
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

        // 在场景销毁时清理定时器
        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            if (this.timerEvent) {
                this.timerEvent.destroy();
            }
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

        // 在场景销毁时移除监听
        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.events.off('resume-game', resumeListener);
        });
        
        const resumeListener = () => {
            this.pause_button.setVisible(true);
        };
    }
    
    private generateNewFruit()
    {
        const randomType = CommonFunction.RandomDistribution(this.FRUITS_TYPES, this.PROBABILITY_PER_DIFFICULTY[this.DIFFICULTY]);
        const randomLevel = this.FRUITS_TYPES.indexOf(randomType);
        if (randomLevel == this.BAD_FRUIT_LEVEL) {
            this.currentFruit = this.matter.add.sprite(this.player.x, this.player.y + 100, randomType, undefined, {
                shape: {
                    type: 'circle',
                    radius: this.BAD_FRUIT_RADIUS[this.DIFFICULTY - 4]
                },
                collisionFilter: {
                    group: ProductGame.UNPLACED_FRUIT_GROUP,
                    category: 0x0001,
                    mask: 0x0002 | 0x0004
                },
                restitution: 0.2
            });
            this.currentFruit.setScale(100 / this.currentFruit.width);
            this.currentFruit.setAlpha(0.5);
            this.currentFruit.setData({ 'level': randomLevel })
            this.currentFruit.setIgnoreGravity(true)
            this.currentFruit.setFixedRotation()
        } else {
            this.currentFruit = this.matter.add.sprite(this.player.x, this.player.y + 100, randomType, undefined, {
                shape: {
                    type: 'circle',
                    radius: this.FRUITS_RADIUS[randomLevel]
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
            this.currentFruit.setData({ 'level': randomLevel })
            this.currentFruit.setIgnoreGravity(true)
            this.currentFruit.setFixedRotation()
        }
        
        
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
        if (level == this.BAD_FRUIT_LEVEL) {
            return;
        }else {
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
                    radius: this.FRUITS_RADIUS[newLevelNumber],
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

            if (newLevelNumber === this.TARGET_LEVEL) {
                console.log('产品开发完成，返回开发中心!');

                const task = this.currentOrder.items.find(item => item.item.id === 'product_design');
                if (task) {
                    task.status = 'completed';
                    console.log(`任务 ${task.item.name} 已标记为完成`);
                }

                this.scene.start('GameEntrance', {order: this.currentOrder});

            }
        }
    }
    
}