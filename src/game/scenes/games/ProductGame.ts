import { GameObjects, Scene, Physics, Time } from "phaser";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
import CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export class ProductGame extends Scene 
{
    /* const some key keyboard-key */
    Key_D: Phaser.Input.Keyboard.Key | undefined 
    Key_A: Phaser.Input.Keyboard.Key | undefined 
    Key_SPACE: Phaser.Input.Keyboard.Key | undefined ;
    
    /* base variable */
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
    
    /* fruit game logical part */
    FRUITS_TYPES: string[] = ['game-product-fruit1']
    fruits: Physics.Arcade.Group; // a group of fruits has placed
    dorpTimer: Time.TimerEvent;
    waitingForDorp: boolean = false;
    previewFruit: SpriteWithDynamicBody | null = null;
    currentFruit: SpriteWithDynamicBody | null = null;
    private wasSpaceDown: undefined | boolean = false;
    
    constructor() 
    {
        super("ProductGame");
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
        platform_left.setScale(2 / platform_left.width, 4).refreshBody();
        platform_left.visible = false;
        
        const platform_right = this.platforms.create(rectX + rectWidth, rectY, 'game-product-platform');
        platform_right.setScale(2 / platform_right.width, 4).refreshBody();
        platform_right.visible = false;
        
        /* init the game core logical part */
        this.fruits = this.physics.add.group({
            collideWorldBounds: true,
            bounceY: 0.2,
            bounceX: 0.2,
        });
        this.generateNewFruit();
        
        

        /* Collision detection */
        this.physics.add.collider(this.platforms, this.player);
        this.physics.add.collider(this.fruits, this.fruits, this.syntheticFruits, this.isFruitSame, this);
        
    }
    
    update()
    {
        /* player move */
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const cursors: CursorKeys = this.input.keyboard.createCursorKeys();
        
        if (cursors.left.isDown || this.Key_A?.isDown) {
            this.player.setVelocityX(-160)
            if (this.anims.exists('player-move-left')) {
                this.player.anims.play('player-move-left', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(-160)
            }
        } else if(cursors.right.isDown || this.Key_D?.isDown) {
            this.player.setVelocityX(160)
            if (this.anims.exists('player-move-right')) {
                this.player.anims.play('player-move-right', true);
            }
            if (this.currentFruit) {
                this.currentFruit.setVelocityX(160)
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
        this.currentFruit = this.physics.add.sprite(this.player.x, this.player.y + 100, randomType) as SpriteWithDynamicBody;
        this.currentFruit.setScale(100 / this.currentFruit.width);
        this.currentFruit.setAlpha(0.5);
        this.currentFruit.setData({ 'level': randomNumber })
        this.currentFruit.body.setAllowGravity(false);
        this.currentFruit.setCollideWorldBounds(true)
        
        /* collider detection */
        this.physics.add.collider(this.platforms, this.currentFruit);
    }
    
    private placeFruits()
    {
        if (this.currentFruit) {
            this.currentFruit.setAlpha(1);
            this.currentFruit.body.setAllowGravity(true);
            this.fruits.add(this.currentFruit);
            this.currentFruit = null;
            
            this.generateNewFruit();
        }
    }
    
    private isFruitSame(obj1: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody, 
                        obj2: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody,): boolean 
    {
        if (!('getData' in obj1 ) || !("getData" in obj2)) {
            return false;
        }
        console.log('fruit same', obj1.getData('level'), obj2.getData('level'))
        return obj1.getData('level') === obj2.getData('level');
    }
    
    private syntheticFruits(): void {
        console.log('synthetic fruits');
        // TODO : 这里需要实现合成的逻辑
    }
}