import { GameObjects, Scene, Physics, Time } from "phaser";
import {CommonFunction} from "../../../../utils/CommonFunction.ts";
import CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
import { CustomerOrder } from "../../Game.ts";
import {FRUITS_TYPES, introduction, operation, ProductGameProperties, GameResult, levelScoreTable} from "./Types.ts";

export class ProductGame extends Scene 
{
    private currentOrder: CustomerOrder;
    /* 按键变量 */
    private Key_D: Phaser.Input.Keyboard.Key | undefined 
    private Key_A: Phaser.Input.Keyboard.Key | undefined 
    private Key_SPACE: Phaser.Input.Keyboard.Key | undefined ;
    private returnButton: Phaser.GameObjects.Image | null = null;
    /* 游戏基础不可变变量 */
    private graphics : GameObjects.Graphics;
    private platforms: MatterJS.BodyType[];
    private pause_button: GameObjects.Container;
    private player: Physics.Matter.Sprite;
    private time_use: GameObjects.Text // 时间
    private time_use_number: number = 0;
    private time_remaining: number; // 剩余时间
    private score: number = 0; // 分数
    private levelScoreTable: number[];
    private scoreText: Phaser.GameObjects.Text;
    private TARGET_LEVEL: number = 7;
    private BAD_FRUIT_LEVEL: number = 8;
    private FRUITS_TYPES: string[];
    private FRUITS_RADIUS: number[] = [20, 28, 36, 44, 52, 60, 68, 76];
    
    /* 事件 */
    private timerEvent: Time.TimerEvent;
    
    /* 游戏配置变量 */
    private PROPERTY: ProductGameProperties;
    
    /* 游戏变量 */
    DIFFICULTY: number;
    private PLAYER_MOVE_SPEED: number;
    private PROBABILITY: number[];
    private BAD_FRUIT_RADIUS: number | null;
    private BAD_FRUIT_KEY: string | null;
    private TIME_LIMIT: number;
    private max_level_index: number;
    
    
    /* 游戏逻辑全局所需变量 */
    // 暂时定为8个水果加一个坏水果， 最后一个是坏水果
    private fruits: Physics.Matter.Sprite[] = []; // a group of fruits has placed
    private previewFruitImage: GameObjects.Image;
    private previewFruit: string;
    private currentFruit: Phaser.Physics.Matter.Sprite | null = null;
    private wasSpaceDown: undefined | boolean = false;
    private static readonly PLACED_FRUIT_GROUP = 1;
    private static readonly UNPLACED_FRUIT_GROUP = -2;
    private static readonly MIN_PLACE_INTERVAL = 500;
    private lastPlaceTime: number = 0;
    
    // 音乐
    private bgMusic: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    private buttonClickSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    private mergeSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;

    // game result
    private gameResult: GameResult;
    
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
                    debug: false,
                },
            },
        });
    }
    
    init(data: { order: CustomerOrder }): void {
        this.currentOrder = data.order;
        console.log('ProductGame received order:', this.currentOrder);
        
        // 将游戏变量清零
        this.score = 0;
        this.time_use_number = 0;
        
        // 初始化不可变量
        this.FRUITS_TYPES = FRUITS_TYPES;
        this.levelScoreTable = levelScoreTable;
        this.PROPERTY = ProductGameProperties[this.currentOrder.items.find(item => item.item.id === 'product_design')?.item.difficulty || 1];
        
        // 提取游戏属性
        this.DIFFICULTY = this.PROPERTY.DIFFICULTY;
        this.PLAYER_MOVE_SPEED = this.PROPERTY.player_move_speed;
        this.PROBABILITY = this.PROPERTY.PROBABILITY;
        this.BAD_FRUIT_RADIUS = this.PROPERTY.BAD_FRUIT_RADIUS;
        this.BAD_FRUIT_KEY = this.PROPERTY.BAD_FRUIT_KEY;
        this.TIME_LIMIT = this.PROPERTY.TIME_LIMIT;
        this.max_level_index = 0;
        this.time_remaining = this.TIME_LIMIT;
    }
    create(): void
    {
        this.checkAssets();
        this.createBackGround();
        this.createSoundAll();
        this.playSound();
        
        /* init keys */
        this.Key_D = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.Key_SPACE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        this.Key_A = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        
        this.createIntroArea();
        this.createOperationArea();
        this.createBoardArea();
        this.initPause();
        this.initPlayer();
        this.createAnims();
        this.createReturnButton();
        this.createGameArea();
        this.generateNewFruit();
        this.initNextFruit();
        this.createCollisionDetection();
        this.createResetButton();
    }
    
    update()
    {
        /* player move */
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const cursors: CursorKeys = this.input.keyboard.createCursorKeys();
        
        if (cursors.left.isDown || this.Key_A?.isDown) {
            this.player.setVelocityX(0 - this.PLAYER_MOVE_SPEED)
            if (this.anims.exists('player-move-left')) {
                this.player.anims.play('player-move-left', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(0 - this.PLAYER_MOVE_SPEED)
            }
        } else if(cursors.right.isDown || this.Key_D?.isDown) {
            this.player.setVelocityX(this.PLAYER_MOVE_SPEED)
            if (this.anims.exists('player-move-right')) {
                this.player.anims.play('player-move-right', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(this.PLAYER_MOVE_SPEED)
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
    
    private checkAssets() {
        /* Check if the assets exist */
        console.log('🔍 ProductGame 资源检查:');
        console.log('game-product-player 存在:', this.textures.exists('game-product-player'));
        console.log('game-product-platform 存在:', this.textures.exists('game-product-platform'));
    }
    
    private createBackGround() {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "game-product-background");
    }
    
    private createSoundAll(): void {
        this.buttonClickSound = this.sound.add("game-product-button-click");
        this.mergeSound = this.sound.add("game-product-merge");
    }
    
    private playSound() {
        this.bgMusic = this.sound.add("game-product-bg-audio");
        this.bgMusic.play({
            loop: true,
            volume: 0.1
        });
    }
    
    private initPlayer() {
        this.player = this.matter.add.sprite(604, 348 - 140, 'game-product-player', 4, {
            isStatic: false,
            friction: 0,
            collisionFilter: {
                category: 0x0008,
                mask: 0x0004
            }
        });
        this.player.setScale(0.3);
        this.player.setFixedRotation()
    }
    
    private createAnims() {
        if (!this.anims.exists('player-move-left')) {
            this.anims.create({
                key: 'player-move-left',
                frames: this.anims.generateFrameNumbers('game-product-player', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            })
        }
        if (!this.anims.exists('player-move-right')) {
            this.anims.create({
                key: "player-move-right",
                frames: this.anims.generateFrameNumbers('game-product-player', { start: 5, end: 8 }),
                frameRate: 10,
                repeat: -1
            })
        }
        if (!this.anims.exists('player-move-turn')) {
            this.anims.create({
                key: 'player-move-turn',
                frames: [{ key: 'game-product-player', frame: 4 }],
                frameRate: 20,
            })
        }
    }
    
    private createGameArea() {
        const rectWidth: number = 426;
        const rectHeight: number = 480;
        const rectX: number = 391;
        const rectY: number = 240;
        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0xfcf5d3, 0.5);
        this.graphics.lineStyle(2, 0xebd394, 0.8);
        this.graphics.strokeRoundedRect(rectX, rectY, rectWidth, rectHeight, 10);
        this.graphics.fillRoundedRect(rectX, rectY, rectWidth, rectHeight, 10);

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
    }
    
    private incrementTimer() {
        this.time_use_number++;
    }

    private decrementTimer() {
        this.time_remaining--;
        this.time_use.setText(this.timeFormat(this.time_remaining));

        if(this.time_remaining <= 0) {
            this.gameOver();
        }
    }
    
    private createBoardArea(): void {
        this.createTimerArea();
        this.createLevelArea();
        this.createScoreArea();
    }
    
    private createScoreArea(): void {
        this.add.text(1008, 66, "分数: ", {
            fontSize: "24px",
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5)
        this.scoreText = this.add.text(1107, 66, this.score.toString(), {
            fontSize: "32px",
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5)
    }
    
    private updateScoreText(deltaScore: number): void {
        this.score += deltaScore;
        this.scoreText.setText(this.score.toString());
    }
    
    private createTimerArea() {
        
        this.add.text(1008, 114, '时间: ', {
            fontSize: "24px",
            color: '#ffffff',
            align: 'center',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5)
        this.time_use = this.add.text(1104, 114, `00:00`, {
            fontSize: "32px",
            color: '#ffffff',
            align: 'center',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5);

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.timeChange,
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

    private timeChange(): void {
        this.incrementTimer();
        this.decrementTimer();
    }
    
    private createIntroArea() {
        const rectWidth = 254;
        const rectHeight = 348;
        const rectX = 60;
        const rectY = 108;
        
        const padding = 8;
        const cornerRadius = 8;
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffe6b3, 0.8);
        graphics.lineStyle(2, 0xcc6600, 0.8);
        graphics.strokeRoundedRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        graphics.fillRoundedRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        
        const text = this.add.text(rectX + padding, rectY + padding, introduction, {
            fontSize: '14px',
            color: '#4d2600',
            align: 'left',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        });
        
        text.setWordWrapWidth(rectWidth - padding * 2, true);
        
    }
    
    private createOperationArea() {
        const rectWidth = 254;
        const rectHeight = 174;
        const rectX = 60;
        const rectY = 494;
        
        const padding = 5;
        const cornerRadius = 5;
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffe6b3, 0.8);
        graphics.lineStyle(2, Number('#B88A50'), 0.8);
        graphics.strokeRoundedRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        graphics.fillRoundedRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        
        const text = this.add.text(rectX + padding, rectY + padding, operation, {
            fontSize: '15px',
            color: '#59391F',
            align: 'left',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        });
        text.setWordWrapWidth(rectWidth - padding * 2, true);
    }
    
    private createLevelArea() {
        
        this.add.text(1030, 165, "游戏难度: ", {
            fontSize: '24px',
            color: '#ffffff',
            align: 'left',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5);
        
        this.add.text(1137, 165, this.DIFFICULTY.toString(), {
            fontSize: '32px',
            color: '#ffffff',
            align: 'left',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5);
    }
    
    private initPause()
    {
        const pauseGraphics = this.add.graphics();
        pauseGraphics.fillStyle(0xfbf6dc, 0.9);
        pauseGraphics.fillRoundedRect(30, 27, 121, 42, 8);
        
        const pause = this.add.text(89, 47, "暂停", {
            fontSize: '24px',
            color: '#000000',
            align: 'center',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5);
        
        pauseGraphics.setInteractive(new Phaser.Geom.Rectangle(30, 27, 121, 42), Phaser.Geom.Rectangle.Contains);
        
        pauseGraphics.on("pointerdown", () => {
            this.buttonClickSound.play();
            
            this.scene.pause();
            this.scene.launch('PauseMenu', { callerScene: this.scene.key });
            pauseGraphics.setVisible(false);
            pause.setVisible(false);
        })

        this.events.on('resume-game', () => {
            pauseGraphics.setVisible(true);
            pause.setVisible(true);
        })

        // 在场景销毁时移除监听
        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.events.off('resume-game', resumeListener);
        });
        
        const resumeListener = () => {
            this.pause_button.setVisible(true);
        };
    }
    private returnToMainMenu() {
         this.bgMusic.stop();
        this.scene.pause();
         // 返回到游戏入口场景
        this.scene.start('GameEntrance', { order: this.currentOrder });
    }
        /**
     * 创建返回按钮
     */
    private createReturnButton(): void {
        this.returnButton = this.add.image(this.cameras.main.width - 75, 10, 'return-button');
        this.returnButton.setOrigin(0)
        this.returnButton.setInteractive();
        
        // 创建气泡提示文字
        const tooltip = this.add.text(this.returnButton.x - 50, this.returnButton.y + 40, '返回', {
            fontSize: '14px',
            color: '#000000',
            padding: { x: 8, y: 4 },
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5).setVisible(false);
        
        // 绑定点击事件
        this.returnButton.on('pointerdown', () => {
            this.returnToMainMenu();
        });
        
        this.returnButton.on('pointerover', () => {
            this.input.setDefaultCursor('pointer'); // 鼠标变成手形
            tooltip.setVisible(true); // 显示气泡提示
        });
        
        this.returnButton.on('pointerout', () => {
            this.input.setDefaultCursor('default'); // 鼠标恢复默认
            tooltip.setVisible(false); // 隐藏气泡提示
        });
    }

    private initNextFruit(): void
    {
        if (this.previewFruitImage) this.previewFruitImage.destroy();
        this.previewFruit = CommonFunction.RandomDistribution(this.FRUITS_TYPES, this.PROBABILITY);
        const index = this.FRUITS_TYPES.indexOf(this.previewFruit)
        if (index == this.BAD_FRUIT_LEVEL) {
            this.previewFruitImage = this.add.image(1060, 320, this.BAD_FRUIT_KEY!).setOrigin(0.5);
        } else {
            this.previewFruitImage = this.add.image(1060, 320, this.previewFruit).setOrigin(0.5);
        }
    }
    
    private generateNewFruit()
    {
        const randomType = this.previewFruit ? this.previewFruit : this.FRUITS_TYPES[0];
        const randomLevel = this.FRUITS_TYPES.indexOf(randomType);
        if (randomLevel == this.BAD_FRUIT_LEVEL) {
            this.currentFruit = this.matter.add.sprite(this.player.x, this.player.y + 100, this.BAD_FRUIT_KEY!, undefined, {
                shape: {
                    type: 'circle',
                    radius: this.BAD_FRUIT_RADIUS! / 2
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
                    radius: this.FRUITS_RADIUS[randomLevel] / 2
                },
                collisionFilter: {
                    group: ProductGame.UNPLACED_FRUIT_GROUP,
                    category: 0x0001,
                    mask: 0x0001 | 0x0004
                },
                restitution: 0.2
            });
            this.currentFruit.setScale( 1.5 );
            this.currentFruit.setAlpha(0.5);
            this.currentFruit.setData({ 'level': randomLevel })
            this.currentFruit.setIgnoreGravity(true)
            this.currentFruit.setFixedRotation()
        }
        
        
        /* collider detection */
        // this.matter.world.add(this.platforms)
    }
    
    private createCollisionDetection() {
        this.matter.world.add(this.platforms)
        this.matter.world.on('collisionstart',
            (event: Phaser.Physics.Matter.Events.CollisionStartEvent,) =>
            {
                event.pairs.forEach(pairs => {

                    const bodyA = pairs.bodyA.gameObject as Physics.Matter.Sprite | null;
                    const bodyB = pairs.bodyB.gameObject as Physics.Matter.Sprite | null;

                    if (bodyA != null && bodyB != null && this.isFruitSame(bodyA, bodyB)) {
                        this.syntheticFruits(bodyA, bodyB);
                    }
                })

            })
    }
    
    private createResetButton() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xfbf6dc, 0.9);
        graphics.fillRoundedRect(181, 27, 119, 42, 8);
        
        this.add.text(239, 47, "重新开始", {
            fontSize: '24px',
            color: '#000000',
            align: 'center',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
        }).setOrigin(0.5);
        
        graphics.setInteractive(new Phaser.Geom.Rectangle(181, 27, 119, 42), Phaser.Geom.Rectangle.Contains);
        
        graphics.on("pointerdown", () => {
            this.buttonClickSound.play({
                loop: false,
                volume: 0.1
            });
            this.resetGame();
        })
    }
    
    private resetGame() {
        this.fruits.forEach(fruit => {
            fruit.destroy();
        });
        this.fruits = [];
        
        if(this.currentFruit) {
            this.currentFruit.destroy();
            this.currentFruit = null;
        }
        
        this.generateNewFruit();
        this.time_use_number = 0;
        this.score = 0;
        this.scoreText.setText("0");
        this.time_use.setText("00:00");
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
            this.initNextFruit();
        }
    }
    
    private isFruitSame(obj1: Physics.Matter.Sprite, 
                        obj2: Physics.Matter.Sprite,): boolean 
    {
        if (!('getData' in obj1 ) || !("getData" in obj2)) {
            return false;
        }
        // console.log('fruit same', obj1.getData('level'), obj2.getData('level'))
        return obj1.getData('level') === obj2.getData('level');
    }
    
    private syntheticFruits(obj1: Physics.Matter.Sprite, obj2: Physics.Matter.Sprite): void {
        // console.log('synthetic fruits');
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
                    radius: this.FRUITS_RADIUS[newLevelNumber] / 2,
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
            newFruit.setScale( 1.5 );
            this.fruits.push(newFruit);
            // 按合成等级加分
            const mergeScore = this.levelScoreTable[newLevelNumber] || 0;
            this.updateScoreText(mergeScore);
            this.mergeSound.play();

            if (newLevelNumber > this.max_level_index) {
                this.max_level_index = newLevelNumber;
            }

            if (newLevelNumber === this.TARGET_LEVEL) {
                this.gameOver();
            }
        }
    }
    
    private timeFormat(time: number): string{
        const second = time % 60;
        const minute = (time - second) / 60;
        let result: string;
        if (minute < 10) {
            result = "0" + minute;
        } else {
            result = minute.toString();
        }
        if (second < 10) {
            result += ":0" + second;
        } else {
            result += ":" + second;
        }
        return result;
    }

    private gameOver(): void {

        this.gameResult = {
            score: this.score,
            time_use: this.time_use_number,
            max_level_index: this.max_level_index,
            target_level: this.TARGET_LEVEL,
            time_remaining: this.time_remaining
        };

        this.bgMusic.stop();
        this.scene.pause();
        this.scene.launch('GameSuccessForProduct', {currentOrder: this.currentOrder, gameResult: this.gameResult});
         // 返回到游戏入口场景
        this.scene.start('GameEntrance', { order: this.currentOrder });
    }
}