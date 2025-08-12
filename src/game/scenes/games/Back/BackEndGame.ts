import { Scene } from "phaser";
import {CustomerOrder} from "../../Game.ts";
import Dungeon, {Room} from "@mikewesthad/dungeon";
import Tileset = Phaser.Tilemaps.Tileset;
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;
import { Direction, TILE_MAPPING } from "./Types.ts";
import {CommonFunction} from "../../../../utils/CommonFunction.ts";

export class BackEndGame extends Scene
{
    private currentOrder: CustomerOrder;
    
    // 游戏相关变量
    private DIFFICULTY: number = 4; // 游戏难度
    private MAX_ROOM_NUMBER: number;
    
    // public variables
    private player: Player;
    enemies: Enemy[] = [];
    private groundLayer: TilemapLayer
    private stuffLayer: TilemapLayer
    private shadowLayer: TilemapLayer
    private tilemapVisibility: TilemapVisibility
    private dungeon: Dungeon;
    private score: number = 0;
    private scoreText: Phaser.GameObjects.Text;
    private timeNumber: number = 0;
    private timerText: Phaser.GameObjects.Text;
    
    constructor()
    {
        super({
            key: 'BackEndGame',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: {
                        y: 0,
                        x: 0
                    },
                    debug: true
                }
            }
        });
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('BackEndGame received order:', this.currentOrder);
        
        // TODO 接受难度参数
        
        // 初始化部分变量
        this.timeNumber = 0;
        this.score = 0;
    }
    
    preload() {
        this.load.image("tiles", 'assets/games/back-end/tiles.png');
        this.load.spritesheet(
            "game-back-end-player",
            "assets/games/back-end/player.png",
            {
                frameWidth: 64,
                frameHeight: 64,
                margin: 1,
                spacing: 2
            }
        );
        this.load.spritesheet("game-back-end-enemy-static", "assets/games/back-end/slime-static.png", {
            frameWidth: 64,
            frameHeight: 64,
            margin: 0,
            spacing: 0
        });
        this.load.spritesheet('game-back-end-enemy-walk', 'assets/games/back-end/slime-walk.png', {
            frameWidth: 64,
            frameHeight: 64,
            margin: 0,
            spacing: 0
        })
        this.load.spritesheet("game-back-end-enemy-hurt", "assets/games/back-end/slime-hurt.png", {
            frameWidth: 64,
            frameHeight: 64,
            margin: 0,
            spacing: 0
        })
        this.load.spritesheet("game-back-end-enemy-death", "assets/games/back-end/slime-death.png", {
            frameWidth: 64,
            frameHeight: 64,
            margin: 0,
            spacing: 0
        })
        
        //temp
        
        this.load.image("Book", "assets/ui/icons/book.png")
    }

    create()
    {
        // Simple background for now
        this.cameras.main.setBackgroundColor('#333333');
        
        this.initGame();
        this.createTimer();
        this.createIntro();
        this.createScore();
        
        this.events.on("back-end-game-over", this.gameOver, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.events.off("back-end-game-over", this.gameOver, this);
            this.enemies.forEach(enemy => {
                enemy.destroy();
            })
            this.enemies = [];
        })
    }

    update(time: number, delta: number) {
        if(this.player.sprite.body) {
            this.player.update(time, delta);

            const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
            const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
            const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);
            if(playerRoom) {
                this.tilemapVisibility.setActiveRoom(playerRoom);
                this.tilemapVisibility.setActiveEnemies(playerRoom);
            } 
        }
        
        this.enemies.forEach(enemy => {
            enemy.update(this.player.sprite);
        })
    }
    
    gameOver(): void {
        const centerX = this.cameras.main.width / 2 + this.cameras.main.worldView.x;
        const centerY = this.cameras.main.height / 2 + this.cameras.main.worldView.y;
        const gameOverText = this.add.text(centerX, centerY, 'GAME OVER', {
            fontSize: '64px', color: '#FF6347', stroke: '#FFFFFF', strokeThickness: 8,
            fontFamily: '"Arial Black", Gadget, sans-serif'
        }).setOrigin(0.5);
        gameOverText.setShadow(5, 5, 'rgba(0,0,0,0.5)', 15);

        // 创建重新开始按钮
        const restartButton = this.add.text(centerX, centerY + 100, 'Restart', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            // 重新开始游戏
            this.scene.restart();
        });
    }
    
    initGame() {
        const MaxRoomNumberArr: number[] = [1, 3, 5, 7, 9];
        const MaxRoomNumber: number = MaxRoomNumberArr[this.DIFFICULTY];
        this.createAnims();

        this.dungeon = new Dungeon({
            width: 100,
            height: 100,
            rooms: {
                width: {
                    min: 7,
                    max: 15,
                    onlyOdd: true,
                },
                height: {
                    min: 7,
                    max: 15,
                    onlyOdd: true,
                },
                maxRooms: MaxRoomNumber,
            },
            doorPadding: 2,
        })

        const map = this.make.tilemap({
            tileWidth: 48,
            tileHeight: 48,
            width: this.dungeon.width,
            height: this.dungeon.height,
        })

        const tileset: Tileset = TypeNullCheck(map.addTilesetImage('tiles', undefined, 48, 48, 1, 2), "Tileset 加载失败");
        this.groundLayer = TypeNullCheck(map.createBlankLayer('ground', tileset), "Tilemap 图层创建失败").fill(TILE_MAPPING.BLANK);
        this.stuffLayer = TypeNullCheck(map.createBlankLayer('stuff', tileset), "Tilemap 图层创建失败");
        this.shadowLayer = TypeNullCheck(map.createBlankLayer('shadow', tileset), "Tilemap 图层创建失败").fill(TILE_MAPPING.BLANK);
        this.tilemapVisibility = new TilemapVisibility(this, this.shadowLayer);
        
        // 地图框架图层
        this.dungeon.rooms.forEach(room => {
            const {x, y, width, height, left, right, top, bottom} = room;
            this.groundLayer.weightedRandomize(TILE_MAPPING.FLOOR, x + 1, y + 1, width - 2, height - 2);
            this.groundLayer.putTileAt(TILE_MAPPING.WALL.TOP_LEFT, left, top);
            this.groundLayer.putTileAt(TILE_MAPPING.WALL.TOP_RIGHT, right, top);
            this.groundLayer.putTileAt(TILE_MAPPING.WALL.BOTTOM_RIGHT, right, bottom);
            this.groundLayer.putTileAt(TILE_MAPPING.WALL.BOTTOM_LEFT, left, bottom);

            this.groundLayer.weightedRandomize(
                TILE_MAPPING.WALL.TOP,
                left + 1,
                top,
                width - 2,
                1
            );
            this.groundLayer.weightedRandomize(
                TILE_MAPPING.WALL.BOTTOM,
                left + 1,
                bottom,
                width - 2,
                1
            );
            this.groundLayer.weightedRandomize(
                TILE_MAPPING.WALL.LEFT,
                left,
                top + 1,
                1,
                height - 2
            );
            this.groundLayer.weightedRandomize(
                TILE_MAPPING.WALL.RIGHT,
                right,
                top + 1,
                1,
                height - 2
            );
            const doors = room.getDoorLocations();
            for(let i = 0; i < doors.length; i++) {
                if (doors[i].y === 0) {
                    this.groundLayer.putTilesAt(
                        TILE_MAPPING.DOOR.TOP,
                        x + doors[i].x - 1,
                        y + doors[i].y
                    );
                } else if (doors[i].y === room.height - 1) {
                    this.groundLayer.putTilesAt(
                        TILE_MAPPING.DOOR.BOTTOM,
                        x + doors[i].x - 1,
                        y + doors[i].y
                    );
                } else if (doors[i].x === 0) {
                    this.groundLayer.putTilesAt(
                        TILE_MAPPING.DOOR.LEFT,
                        x + doors[i].x,
                        y + doors[i].y - 1
                    );
                } else if (doors[i].x === room.width - 1) {
                    this.groundLayer.putTilesAt(
                        TILE_MAPPING.DOOR.RIGHT,
                        x + doors[i].x,
                        y + doors[i].y - 1
                    );
                }
            }
        });

        this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
        
        // 物品图层
        // stuffLayer.fill(TILE_MAPPING.BLANK);
        
        const rooms = this.dungeon.rooms.slice();
        const startRoom = rooms.shift() as Room;
        const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms) as Room;
        const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);
        const enemyPosition: {x: number, y: number, room: Room}[] = [];
        
        this.stuffLayer.putTileAt(TILE_MAPPING.STAIRS, endRoom.centerX, endRoom.centerY);

        otherRooms.forEach(room => {
            const rand = Math.random();
            if (rand <= 0.25) {
                // 25% chance of chests
                this.stuffLayer.putTileAt(TILE_MAPPING.CHEST, room.centerX, room.centerY);
            } else if (rand <= 0.5) {
                // 50% chance of a pot anywhere in the room... except don't block a door!
                const x: number = Phaser.Math.Between(room.left + 2, room.right - 2);
                const y: number = Phaser.Math.Between(room.top + 2, room.bottom - 2);
                this.stuffLayer.weightedRandomize(x, y, 1, 1, TILE_MAPPING.POT);
            } else {
                // 25% of either 2 or 4 towers, depending on the room size
                if (room.height >= 9) {
                    this.stuffLayer.putTilesAt(TILE_MAPPING.TOWER, room.centerX - 1, room.centerY + 1);
                    this.stuffLayer.putTilesAt(TILE_MAPPING.TOWER, room.centerX + 1, room.centerY + 1);
                    this.stuffLayer.putTilesAt(TILE_MAPPING.TOWER, room.centerX - 1, room.centerY - 2);
                    this.stuffLayer.putTilesAt(TILE_MAPPING.TOWER, room.centerX + 1, room.centerY - 2);
                } else {
                    this.stuffLayer.putTilesAt(TILE_MAPPING.TOWER, room.centerX - 1, room.centerY - 1);
                    this.stuffLayer.putTilesAt(TILE_MAPPING.TOWER, room.centerX + 1, room.centerY - 1);
                }
            }

            const randX: number = Phaser.Math.Between(room.left + 2, room.right - 2);
            const randY: number = Phaser.Math.Between(room.top + 2, room.bottom - 2);
            const worldX: number = this.stuffLayer.tileToWorldX(randX);
            const worldY: number = this.stuffLayer.tileToWorldY(randY);
            if (true) {
                enemyPosition.push({x: worldX, y: worldY, room: room});
            }
        });

        this.stuffLayer.setTileIndexCallback(TILE_MAPPING.STAIRS, () => {
            console.log("Player reached the stairs!");
            this.stuffLayer.setTileIndexCallback(TILE_MAPPING.STAIRS, () => {}, this);
            this.player.freeze();
            {
                const task = this.currentOrder.items.find(item => item.item.id === 'backend_dev');
                if (task) {
                    task.status = 'completed';
                    console.log(`任务 ${task.item.name} 已标记为完成`);
                }
                this.scene.start('GameEntrance', { order: this.currentOrder });
            }
        }, this);

        this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

        // 初始化玩家
        this.player = new Player(this, map.widthInPixels / 2, map.heightInPixels / 2, this.DIFFICULTY);
        this.physics.add.collider(this.player.sprite, this.groundLayer);
        this.physics.add.collider(this.player.sprite, this.stuffLayer);
        
        enemyPosition.forEach((pos) => {
            const enemy = new Enemy(this, pos.x, pos.y, this.DIFFICULTY, [this.groundLayer, this.stuffLayer], pos.room);
            enemy.sprite.setVisible(false);
            this.enemies.push(enemy);
            this.physics.add.collider(enemy.sprite, this.groundLayer);
            this.physics.add.collider(enemy.sprite, this.stuffLayer);
            this.physics.add.collider(this.player.sprite, enemy.sprite, this.handlePlayerEnemyCollider, undefined, this);
        })

        const camera = this.cameras.main;
        camera.startFollow(this.player.sprite);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }
    
    handlePlayerEnemyCollider(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        const realEnemy: Enemy = enemy.getData("owner") as Enemy;
        this.player.healthDecrease(realEnemy.getDamage());
    }
    
    createAnims(): void {
        const anims = this.anims;
        const moveDuration = 48 / Enemy.prototype.speed * 1000;
        
        if (!anims.exists("enemy-standby")){
            anims.create({
                key: "enemy-standby",
                frames: anims.generateFrameNumbers("game-back-end-enemy-static", { start: 0, end: 5 }),
                repeat: -1,
                duration: 1000,
            })
        }
        if (!anims.exists("enemy-walk-left")){
            anims.create({
                key: "enemy-walk-left",
                frames: anims.generateFrameNumbers("game-back-end-enemy-walk", { start: 16, end: 23 }),
                frameRate: 8,
                repeat: 1,
                duration: moveDuration
            })
        }
        if (!anims.exists("enemy-walk-right")){
            anims.create({
                key: "enemy-walk-right",
                frames: anims.generateFrameNumbers("game-back-end-enemy-walk", { start: 24, end: 31 }),
                frameRate: 8,
                repeat: 1,
                duration: moveDuration
            })
        }
        if (!anims.exists("enemy-walk-up")){
            anims.create({
                key: "enemy-walk-up",
                frames: anims.generateFrameNumbers("game-back-end-enemy-walk", { start: 8, end: 15 }),
                frameRate: 8,
                repeat: 1,
                duration: moveDuration
            })
        }
        if (!anims.exists("enemy-walk-down")){
            anims.create({
                key: "enemy-walk-down",
                frames: anims.generateFrameNumbers("game-back-end-enemy-walk", { start: 0, end: 7 }),
                frameRate: 8,
                repeat: 1,
                duration: moveDuration
            })
        }
        if (!anims.exists("enemy-hurt")){
            anims.create({
                key: "enemy-hurt",
                frames: anims.generateFrameNumbers("game-back-end-enemy-hurt", { start: 0, end: 4 }),
                repeat: 0,
                duration: 800,
            })
        }
        if (!anims.exists("enemy-death")){
            anims.create({
                key: "enemy-death",
                frames: anims.generateFrameNumbers("game-back-end-enemy-death", { start: 0, end: 9 }),
                frameRate: 5,
                repeat: 0,
            })
        }
    }
    
    createTimer() {
        this.add.graphics().fillStyle(0xffffff, 1).fillRect(200, 0, 200, 50).setScrollFactor(0);
        this.timerText = this.add.text(300, 0, "Time:\n 00:00", { fontSize: "24px", color:"#000"}).setScrollFactor(0);
        
        this.time.addEvent({
            delay: 1000,
            callback: () => {this.updateTimer()},
            callbackScope: this,
            loop: true,
        })
    }
    
    updateTimer() {
        this.timeNumber += 1
        this.timerText.setText("Time: \n" + this.timeTranslate(this.timeNumber));
    }
    
    createIntro() {
        const book = this.add.image(500, 30, "book").setInteractive();
        const scale = 0.3;
        book.setScrollFactor(0);
        book.setScale(scale)
        book.on("pointerdown", () => {
            book.setScale(scale * 0.8);
        })
        book.on("pointerup", () => {
            book.setScale(scale)
            this.scene.pause();
            console.log("start a pop")
            this.scene.launch("BackEndGamePop");
        })
        book.on("pointerover", () => {
            book.setScale(scale * 1.2)
        })
        book.on("pointerout", () => {
            book.setScale(scale)
        })
    }
    
    createOperation() {
        const book = this.add.image(600, 30, "book").setInteractive();
        book.setScrollFactor(0);
        const scale = 0.3;
        book.setScale(scale)
        book.on("pointerdown", () => {
            book.setScale(scale * 0.8);
        })
        book.on("pointerup", () => {
            book.setScale(scale)
        })
        book.on("pointerover", () => {
            book.setScale(scale * 1.2)
        })
        book.on("pointerout", () => {
            book.setScale(scale)
        })
    }
    
    createScore()
    {
        this.add.graphics().fillStyle(0xffffff, 1).fillRect(0, 0, 200, 50).setScrollFactor(0);
        this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "24px", color:"#000"}).setScrollFactor(0);
    }
    
    createInfo(): void {
        const book = this.add.image(700, 30, "book").setInteractive();
        book.setScrollFactor(0);
        const scale = 0.3;
        book.setScale(scale)
        book.on("pointerdown", () => {
            book.setScale(scale * 0.8);
        })
        book.on("pointerup", () => {
            book.setScale(scale)
        })
        book.on("pointerover", () => {
            book.setScale(scale * 1.2)
        })
        book.on("pointerout", () => {
            book.setScale(scale)
        })
    }

    IncreaseScore()
    {
        this.score += 100;
        this.scoreText.setText("Score: " + this.score);
    }
    
    private timeTranslate(second: number): string
    {
        const minute: number = (second - (second % 60)) / 60
        second = second % 60;
        let result: string = "";
        if (minute == 0) {
            result += "00:";
        } else if (minute <= 9) {
            result += "0" + minute + ":";
        } else {
            result += minute + ":";
        }
        
        if (second <= 9) {
            result += "0" + second;
        } else {
            result += second;
        }
        
        return result;
    }
}

class Player {
    private readonly scene: BackEndGame;
    readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private readonly keys: Phaser.Types.Input.Keyboard.CursorKeys;
    // player properties
    private DIFFICULTY: number;
    private MAXHEALTH: number = 50;
    private health: number = 50;
    private criticalHitRate = 0.08;
    private criticalHitMultiplier = 1.10;
    private injuryFreeRate: number = 0.1;
    private minDamage: number = 10;
    private damage: number = 50;
    private speed: number = 300;
    private attackRange: number = 100;
    private readonly ATTACKCOOLDOWNTIME: number = 3000;
    private attackCoolDown: number = 3000;
    private attackBar: AttackCoolDownBar;
    private healthBar: HealthBar;
    private isInvincible: boolean = false;
    private invincibleDuration: number = 0;
    private flashTimer: number = 0;
    private readonly FLASH_INTERVAL: number = 100;
    
    // Keys
    private input: Phaser.Input.InputPlugin;
    private Key_D: Phaser.Input.Keyboard.Key | undefined;
    private Key_A: Phaser.Input.Keyboard.Key | undefined;
    private Key_W: Phaser.Input.Keyboard.Key | undefined;
    private Key_S: Phaser.Input.Keyboard.Key | undefined;
    
    constructor(scene: BackEndGame, x: number, y: number, difficulty: number) {
        this.scene = scene;
        this.DIFFICULTY = difficulty;
        this.attackBar = new AttackCoolDownBar(this.scene, 0, 700, 200, 30, this.ATTACKCOOLDOWNTIME, this);
        this.healthBar = new HealthBar(this.scene, 0, 100, 200, 20, this.MAXHEALTH, this);
        const anims = this.scene.anims;
        if (!anims.exists("player-walk")){
            anims.create({
                key: "player-walk",
                frames: anims.generateFrameNumbers("game-back-end-player", { start: 46, end: 49 }),
                frameRate: 8,
                repeat: -1,
            });
        }
        if (!anims.exists("player-walk-back")){
            anims.create({
                key: "player-walk-back",
                frames: anims.generateFrameNumbers("game-back-end-player", { start: 65, end: 68 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.sprite = scene.physics.add
            .sprite(x, y, "game-back-end-player", 0)
            .setSize(22, 33)
            .setOffset(23, 27);
        
        this.sprite.anims.play("player-walk-back");
        this.keys = TypeNullCheck(scene.input.keyboard, "keys is null").createCursorKeys();
        this.input = this.scene.input;
        this.Key_D = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.Key_A = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.Key_W = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        this.Key_S = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    }

    freeze() {
        TypeNullCheck(this.sprite.body, "body is null").moves = false;
    }

    update(time: number, delta: number) {
        const keys = this.keys;
        const sprite = this.sprite;
        const prevVelocity = sprite.body.velocity.clone();

        // Stop any previous movement from the last frame
        sprite.body.setVelocity(0);

        // Horizontal movement
        if (this.Key_A?.isDown) {
            sprite.body.setVelocityX(-this.speed);
            sprite.setFlipX(true);
        } else if (this.Key_D?.isDown) {
            sprite.body.setVelocityX(this.speed);
            sprite.setFlipX(false);
        }
        // Vertical movement
        if (this.Key_W?.isDown) {
            sprite.body.setVelocityY(-this.speed);
        } else if (this.Key_S?.isDown) {
            sprite.body.setVelocityY(this.speed);
        }
        
        sprite.body.velocity.normalize().scale(this.speed);
        if (keys.left.isDown || keys.right.isDown || keys.down.isDown || this.Key_A?.isDown || this.Key_D?.isDown || this.Key_S?.isDown) {
            sprite.anims.play("player-walk", true);
        } else if (keys.up.isDown || this.Key_W?.isDown) {
            sprite.anims.play("player-walk-back", true);
        } else {
            sprite.anims.stop();
            if (prevVelocity.y < 0) sprite.setTexture("game-back-end-player", 65);
            else sprite.setTexture("game-back-end-player", 46);
        }
        
        if (keys.up.isDown && this.attackCoolDown <= 0) 
        {
            this.attack(Direction.UP);
            this.attackCoolDown = this.ATTACKCOOLDOWNTIME;
        } else if (keys.down.isDown && this.attackCoolDown <= 0) 
        {
            this.attack(Direction.DOWN);
            this.attackCoolDown = this.ATTACKCOOLDOWNTIME;
        } else if (keys.right.isDown && this.attackCoolDown <= 0) 
        {
            this.attack(Direction.RIGHT);
            this.attackCoolDown = this.ATTACKCOOLDOWNTIME;
        } else if (keys.left.isDown && this.attackCoolDown <= 0)
        {
            this.attack(Direction.LEFT);
            this.attackCoolDown = this.ATTACKCOOLDOWNTIME;
        }
        
        if (this.attackCoolDown > 0) {
            this.attackCoolDown -= delta;
        }
        
        this.attackBar.update(this.attackCoolDown);
        
        if (this.isInvincible) {
            this.invincibleDuration -= delta;
            this.flashTimer += delta;
            
            if (this.invincibleDuration <= 0) {
                this.isInvincible = false;
                this.sprite.alpha = 1;
            } else if (this.flashTimer >= this.FLASH_INTERVAL) {
                this.sprite.alpha = this.sprite.alpha === 1 ? 0.5 : 1;
                this.flashTimer = 0;
            }
        } 
            
    }

    destroy() {
        this.sprite.destroy();
        this.attackBar.destroy();
        this.healthBar.destroy();
    }
    
    healthDecrease(damage: number) {
        if (this.isInvincible) return;
        damage = Math.floor(damage * (1 - this.injuryFreeRate));

        console.log("玩家将受到" + damage + "点伤害");
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
        }
        this.healthBar.update(this.health);
        
        this.activateInvincibility(2000);
        
        if (this.health <= 0) {
            this.destroy();
            this.scene.events.emit("back-end-game-over");
        }
    }
    
    attack(direction: Direction)
    {
        const enemyInRange = this.scene.enemies.filter(enmey => {
            const dx = enmey.sprite.x - this.sprite.x;
            const dy = enmey.sprite.y - this.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const isInRange = distance <= this.attackRange;
            if (isInRange) {
                switch (direction) {
                    case Direction.UP:
                        if (dy < 0) {
                            return true;
                        }
                        break;
                    case Direction.DOWN:
                        if (dy > 0) {
                            return true;
                        }
                        break;
                    case Direction.LEFT:
                        if (dx < 0) {
                            return true;
                        }
                        break;
                    case Direction.RIGHT:
                        if (dx > 0) {
                            return true;
                        }
                        break;
                }
            }
            return false;
        })
        console.log( "attack to " + direction);
        enemyInRange.forEach(enemy => {
            enemy.healthDecrease(this.getDamage());
        })
    }

    activateInvincibility(duration: number): void {
        this.isInvincible = true;
        this.invincibleDuration = duration;
        this.flashTimer = 0;
        this.sprite.alpha = 0.5; // 初始化为半透明
    }
    
    getDamage(): number {
        let realDamage = CommonFunction.getNumberInNormalDistribution(this.damage, 50);
        if (CommonFunction.simulateEvent(this.criticalHitRate)) {
           realDamage *= this.criticalHitMultiplier 
        }
        if (realDamage < this.minDamage) realDamage = this.minDamage;
        return Math.floor(realDamage);
    }
    
}

class Enemy {
    private scene: BackEndGame;
    readonly sprite;
    private isMoving = false;
    private tileSize = 48;
    private readonly tileLayers: TilemapLayer[];
    private DIFFICULTY: number;
    public readonly speed: number = 100;
    private health: number = 100;
    private sight_distance: number = 200;
    private readonly room: Room;
    private isDead: boolean = false;
    private isHurt: boolean = false;
    private damage: number = 10;
    private minDamage: number = 5;
    private criticalHitRate = 0.08;
    private criticalHitMultiplier = 1.10;
    private injuryFreeRate: number = 0.1;
    
    constructor(scene: BackEndGame, x: number, y: number, difficulty: number, layers: TilemapLayer[], room: Room) {
        this.scene = scene;
        this.DIFFICULTY = difficulty;
        this.tileLayers = layers;
        this.room = room;
        
        this.sprite = scene.physics.add
            .sprite(x, y, 'game-back-end-enemy-static', 0)
            .setSize(22, 23)
            .setOffset(23, 27)
            .setScale(1.5);
        
        // 给精灵对象添加一条数据，使其指向自己的Enemy类，从而方便在碰撞检测中获取一些数据
        this.sprite.setData("owner", this);
        
        this.sprite.anims.play("enemy-standby");
    }
    
    destroy() {
        const index = this.scene.enemies.indexOf(this);
        if (index != -1){
            this.scene.enemies.splice(index, 1);
        }
        this.sprite.body.destroy();
        this.sprite.destroy();
        this.scene.IncreaseScore();
    }
    
    update(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        const enemy = this.sprite;
        if (!enemy) return;
        if (!enemy.body) return;
        if (this.isDead) return;
        if (this.isHurt) return;
        
        if(this.isMoving) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.sight_distance) {
            this.isMoving = true;
            let targetX = enemy.x;
            let targetY = enemy.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                targetX += dx > 0 ? this.tileSize : -this.tileSize;
            } else {
                targetY += dy > 0 ? this.tileSize : -this.tileSize;
            }

            for (let i = 0; i < this.tileLayers.length; i++) {
                const tile = this.tileLayers[i];
                const targetTileX = tile.worldToTileX(targetX);
                const targetTileY = tile.worldToTileY(targetY);
                const targetTile = tile.getTileAt(targetTileX, targetTileY);
                if (targetTile && targetTile.collides) {
                    this.isMoving = false;
                    enemy.body.setVelocity(0);
                    enemy.anims.play("enemy-standby");
                    return;
                }
            }
            
            const moveDuration = (this.tileSize / this.speed) * 1000;
            const vx = (targetX - enemy.x) / moveDuration * 1000;
            const vy = (targetY - enemy.y) / moveDuration * 1000;
            
            enemy.body.setVelocity(vx, vy);

            if (vx > 0) {
                enemy.anims.play("enemy-walk-right", true);
            } else if (vx < 0) {
                enemy.anims.play("enemy-walk-left", true);
            } else if (vy > 0) {
                enemy.anims.play("enemy-walk-down", true);
            } else if (vy < 0) {
                enemy.anims.play("enemy-walk-up", true);
            }

            this.scene.time.delayedCall(moveDuration, () => {
                if (enemy && enemy.body)
                enemy.body.setVelocity(0);
                this.isMoving = false;
            });
            
        } else {
            if (enemy && enemy.body) {
                enemy.body.setVelocity(0);
            }
            if (enemy) {
                enemy.anims.play("enemy-standby", true);
            }
        }
    }
    
    healthDecrease(damage: number) {
        if (this.health <= 0 || !this.sprite || !this.sprite.body) return;
        
        damage = Math.floor(damage * (1 - this.injuryFreeRate));
        console.log("怪物将收到" + damage + "点伤害");
        
        if(this.health - damage <= 0){
            this.isDead = true;
            if (this.sprite.body) {
                this.sprite.body.setVelocity(0, 0);
                this.sprite.body.enable = false;
                this.sprite.body.checkCollision.none = true;
            }
            this.sprite.anims.play("enemy-death");
            this.sprite.on("animationcomplete", () => {
                this.destroy();
            })
        } else {
            this.health -= damage;
            this.isHurt = true;
            this.sprite.anims.play("enemy-hurt");
            this.sprite.on("animationcomplete", () => {
                this.isHurt = false;
            })
        }
    }
    
    getDamage(): number {
        let realDamage = CommonFunction.getNumberInNormalDistribution(this.damage, 50);
        if (CommonFunction.simulateEvent(this.criticalHitRate)) {
            realDamage *= this.criticalHitMultiplier;
        }
        if (realDamage < this.minDamage) realDamage = this.minDamage;
        return Math.floor(realDamage);
    }
    
    getRoom() {
        return this.room;
    }
}

class AttackCoolDownBar {
    private readonly scene: BackEndGame;
    private readonly owner: Player;
    private graphics: Phaser.GameObjects.Graphics;
    private readonly maxCoolDown: number;
    private readonly x: number;
    private readonly y: number;
    private readonly width: number;
    private readonly height: number;
    
    constructor(scene: BackEndGame, x: number, y: number, width: number, height: number = 30, maxCoolDown: number, owner: Player) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxCoolDown = maxCoolDown;
        this.owner = owner;
        
        this.graphics = this.scene.add.graphics().setScrollFactor(0);
        this.graphics.setDepth(10);
        
        // 设置背景
        const graphicsBg = this.scene.add.graphics().setScrollFactor(0);
        graphicsBg.setDepth(9);
        graphicsBg.fillStyle(0xffffff, 0.5);
        graphicsBg.fillRect(this.x, this.y, this.width, this.height);
    }
    
    update(coolDown: number){
        this.draw(coolDown);
    }
    
    private draw(coolDown: number) {
        this.graphics.clear();
        
        const progress = (this.maxCoolDown - coolDown) / this.maxCoolDown; // 冷却百分比
        const barWidth = this.width * progress;
        
        this.graphics.fillStyle(coolDown <= 0 ? 0xB72121 : 0x11ce49, 0.8);
        this.graphics.fillRect(this.x, this.y, barWidth, this.height);
    }
    
    destroy() {
        this.graphics.destroy();
    }
}

class HealthBar {
    private readonly scene: BackEndGame;
    private readonly owner: Player;
    private graphics: Phaser.GameObjects.Graphics;
    private readonly graphicsBg: Phaser.GameObjects.Graphics;
    private readonly MAXHEALTH: number;
    private readonly x: number;
    private readonly y: number;
    private readonly width: number;
    private readonly height: number;
    private text: Phaser.GameObjects.Text;

    constructor(scene: BackEndGame, x: number, y: number, width: number, height: number = 5, maxHealth: number, owner: Player) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.owner = owner;
        this.MAXHEALTH = maxHealth;
        

        this.graphics = this.scene.add.graphics().setScrollFactor(0);
        this.graphics.setDepth(10);

        // 设置背景
        this.graphicsBg = this.scene.add.graphics().setScrollFactor(0);
        this.graphicsBg.setDepth(9);
        this.graphicsBg.fillStyle(0x868388, 0.5);
        this.graphicsBg.fillRect(this.x, this.y, this.width, this.height);
        
        this.update(this.MAXHEALTH)
    }

    update(currentHealth: number){
        this.draw(currentHealth);
        this.write(currentHealth);
    }

    private draw(currentHealth: number): void {
        this.graphics.clear();

        const progress = currentHealth / this.MAXHEALTH; // 冷却百分比
        const barWidth = this.width * progress;

        this.graphics.fillStyle(0xB72121, 0.8);
        this.graphics.fillRect(this.x, this.y, barWidth, this.height);
    }
    
    private write(currentHealth: number): void {
        if (this.text) this.text.destroy();
        this.text = this.scene.add.text(this.x + this.width / 2, this.y + this.height / 2, currentHealth + "/" + this.MAXHEALTH, {fontSize: "28px", color: "#ffffff", align: "center"})
            .setScrollFactor(0)
            .setOrigin(0.5, 0.5)
            .setDepth(11);
    }

    destroy() {
        this.graphics.destroy();
    }
}

class TilemapVisibility {
    private scene: BackEndGame;
    private shadowLayer: TilemapLayer;
    private activeRoom: Room | null;
    
    constructor(scene: BackEndGame, shadowLayer: TilemapLayer) {
        this.shadowLayer = shadowLayer;
        this.activeRoom = null;
        this.scene = scene;
        
        // init the enemies with invisible
        this.scene.enemies.forEach(
            enemy => {
                enemy.sprite.alpha = 0;
            }
        )
    }

    setActiveRoom(room: Room) {
        // We only need to update the tiles if the active room has changed
        if (room !== this.activeRoom) {
            this.setRoomAlpha(room, 0); // Make the new room visible
            if (this.activeRoom) this.setRoomAlpha(this.activeRoom, 0.5); // Dim the old room
            this.activeRoom = room;
        }
    }

    setActiveEnemies(room: Room) {
        // console.log("setActiveEnemies", room);
        this.scene.enemies.forEach(
            enemy => {
                // console.log("enemy.getRoom()", enemy.getRoom());
                if (enemy.getRoom() == room) {
                    enemy.sprite.setVisible(true);
                }
            }
        )
    }
    
    // Helper to set the alpha on all tiles within a room
    setRoomAlpha(room: Room, alpha: number) {
        this.shadowLayer.forEachTile(
            t => (t.alpha = alpha),
            this,
            room.x,
            room.y,
            room.width,
            room.height
        );
    }
}

function TypeNullCheck<T>(element: T | null, msg: string): T {
    if (element === null) {
        throw new Error(msg);
    }
    return element;
}


