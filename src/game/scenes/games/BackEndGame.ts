import { Scene } from "phaser";
import {CustomerOrder} from "../Game.ts";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import Dungeon from "@mikewesthad/dungeon";
import Tileset = Phaser.Tilemaps.Tileset;
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;

export class BackEndGame extends Scene
{
    private currentOrder: CustomerOrder;
    
    // 游戏相关变量
    private DIFFICULTY: number = 4; // 游戏难度
    private health: number;
    private damage: number;
    private speed: number;
    private MAX_ROOM_NUMBER: number;
    
    // public variables
    private map: Phaser.Tilemaps.Tilemap;
    private player: Player;

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
    }

    create()
    {
        // Simple background for now
        this.cameras.main.setBackgroundColor('#333333');

        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY, 'button-normal', 'button-pressed', '完成后端', 10, () => {
            console.log('后端开发完成，返回开发中心');

            const task = this.currentOrder.items.find(item => item.item.id === 'backend_dev');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }

            this.scene.start('GameEntrance', { order: this.currentOrder });
        });
        
        
        // something new
        this.initGame();
        this.createTimer();
        this.createIntro();
        this.createOperation();
        
    }

    update(time, delta) {
        this.player.update();
    }
    
    initGame() {
        this.initGameMap();
        this.initPlayer();
    }
    
    initGameMap() {
        const MaxRoomNumberArr: number[] = [1, 3, 5, 7, 9];
        const MaxRoomNumber: number = MaxRoomNumberArr[this.DIFFICULTY];
        
        const dungeon = new Dungeon({
            width: 100,
            height: 100,
            rooms: {
                width: {
                    min: 7,
                    max: 15,
                },
                height: {
                    min: 7,
                    max: 15,
                },
                maxRooms: MaxRoomNumber,
            },
            doorPadding: 2,
        })
        
        this.map = this.make.tilemap({
            tileWidth: 48,
            tileHeight: 48,
            width: dungeon.width,
            height: dungeon.height,
        })
        
        const tileset: Tileset = TypeNullCheck(this.map.addTilesetImage('tiles', undefined, 48, 48, 0, 0), "Tileset 加载失败");
        const layer: TilemapLayer = TypeNullCheck(this.map.createBlankLayer('Layer 1', tileset), "Tilemap 图层创建失败");
        
        const mappedTiles = dungeon.getMappedTiles({
            empty: -1,
            floor: 6,
            door: 6,
            wall: 20
        })
        
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        layer.putTilesAt(mappedTiles, 0, 0);
        layer.setCollision(20);

        this.player = new Player(this, this.map.widthInPixels / 2, this.map.heightInPixels / 2);
        this.physics.add.collider(this.player.sprite, layer);

        const camera = this.cameras.main;
        camera.startFollow(this.player.sprite);
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }
    
    initPlayer() {
        const healthArr: number[] = [];
        const damageArr: number[] = [];
        const speedArr: number[] = [];
        
        
        
    }
    
    createTimer() {
        
    }
    
    createIntro() {
        
    }
    
    createOperation() {
        
    }
    
    private generateMap() {
        
    }
}

class Player {
    private scene: Scene;
    readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private readonly keys: Phaser.Types.Input.Keyboard.CursorKeys;
    
    constructor(scene: Scene, x: number, y: number) {
        this.scene = scene;
        const anims = this.scene.anims;
        anims.create({
            key: "player-walk",
            frames: anims.generateFrameNumbers("game-back-end-player", { start: 46, end: 49 }),
            frameRate: 8,
            repeat: -1
        });
        anims.create({
            key: "player-walk-back",
            frames: anims.generateFrameNumbers("game-back-end-player", { start: 65, end: 68 }),
            frameRate: 8,
            repeat: -1
        });

        this.sprite = scene.physics.add
            .sprite(x, y, "game-back-end-player", 0)
            .setSize(22, 33)
            .setOffset(23, 27);
        
        this.sprite.anims.play("player-walk-back");
        this.keys = TypeNullCheck(scene.input.keyboard, "keys is null").createCursorKeys();
    }

    freeze() {
        TypeNullCheck(this.sprite.body, "body is null").moves = false;
    }

    update() {
        const keys = this.keys;
        const sprite = this.sprite;
        const speed = 300;
        const prevVelocity = sprite.body.velocity.clone();

        // Stop any previous movement from the last frame
        sprite.body.setVelocity(0);

        // Horizontal movement
        if (keys.left.isDown) {
            sprite.body.setVelocityX(-speed);
            sprite.setFlipX(true);
        } else if (keys.right.isDown) {
            sprite.body.setVelocityX(speed);
            sprite.setFlipX(false);
        }

        // Vertical movement
        if (keys.up.isDown) {
            sprite.body.setVelocityY(-speed);
        } else if (keys.down.isDown) {
            sprite.body.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        sprite.body.velocity.normalize().scale(speed);

        // Update the animation last and give left/right/down animations precedence over up animations
        if (keys.left.isDown || keys.right.isDown || keys.down.isDown) {
            sprite.anims.play("player-walk", true);
        } else if (keys.up.isDown) {
            sprite.anims.play("player-walk-back", true);
        } else {
            sprite.anims.stop();

            // If we were moving, and now we're not, then pick a single idle frame to use
            if (prevVelocity.y < 0) sprite.setTexture("game-back-end-player", 65);
            else sprite.setTexture("game-back-end-player", 46);
        }
    }

    destroy() {
        this.sprite.destroy();
    }
    
}

function TypeNullCheck<T>(element: T | null, msg: string): T {
    if (element === null) {
        throw new Error(msg);
    }
    return element;
}
