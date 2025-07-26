import { Scene } from "phaser";
import {CustomerOrder} from "../Game.ts";
import {CommonFunction} from "../../../utils/CommonFunction.ts";
import Dungeon, {Room} from "@mikewesthad/dungeon";
import Tileset = Phaser.Tilemaps.Tileset;
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;

export class BackEndGame extends Scene
{
    private currentOrder: CustomerOrder;
    
    // 游戏相关变量
    private DIFFICULTY: number = 4; // 游戏难度
    private MAX_ROOM_NUMBER: number;
    
    // public variables
    private player: Player;
    private groundLayer: TilemapLayer
    private stuffLayer: TilemapLayer
    private shadowLayer: TilemapLayer
    private tilemapVisibility: TilemapVisibility
    private dungeon: Dungeon;
    
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
                    debug: false
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
        
        // something new
        this.initGame();
        this.createTimer();
        this.createIntro();
        this.createOperation();
        
    }

    update(time, delta) {
        this.player.update();

        const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
        const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
        const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

        this.tilemapVisibility.setActiveRoom(playerRoom);
    }
    
    initGame() {
        const MaxRoomNumberArr: number[] = [1, 3, 5, 7, 9];
        const MaxRoomNumber: number = MaxRoomNumberArr[this.DIFFICULTY];

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
        this.tilemapVisibility = new TilemapVisibility(this.shadowLayer);
        
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
        const startRoom = rooms.shift();
        const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
        const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);
        
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

        // init player
        this.player = new Player(this, map.widthInPixels / 2, map.heightInPixels / 2, this.DIFFICULTY);
        this.physics.add.collider(this.player.sprite, this.groundLayer);
        this.physics.add.collider(this.player.sprite, this.stuffLayer);

        const camera = this.cameras.main;
        camera.startFollow(this.player.sprite);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }
    
    createTimer() {
        
    }
    
    createIntro() {
        
    }
    
    createOperation() {
        
    }
}

class Player {
    private scene: Scene;
    readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private readonly keys: Phaser.Types.Input.Keyboard.CursorKeys;
    // player properties
    private DIFFICULTY: number;
    private health: number = 1;
    private damage: number = 10;
    private speed: number = 300;
    
    // Keys
    private input: Phaser.Input.InputPlugin;
    private Key_D: Phaser.Input.Keyboard.Key | undefined;
    private Key_A: Phaser.Input.Keyboard.Key | undefined;
    private Key_W: Phaser.Input.Keyboard.Key | undefined;
    private Key_S: Phaser.Input.Keyboard.Key | undefined;
    
    constructor(scene: Scene, x: number, y: number, difficulty: number) {
        this.scene = scene;
        this.DIFFICULTY = difficulty;
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
        this.input = this.scene.input;
        this.Key_D = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.Key_A = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.Key_W = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        this.Key_S = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    }

    freeze() {
        TypeNullCheck(this.sprite.body, "body is null").moves = false;
    }

    update() {
        const keys = this.keys;
        const sprite = this.sprite;
        const prevVelocity = sprite.body.velocity.clone();

        // Stop any previous movement from the last frame
        sprite.body.setVelocity(0);

        // Horizontal movement
        if (keys.left.isDown || this.Key_A?.isDown) {
            sprite.body.setVelocityX(-this.speed);
            sprite.setFlipX(true);
        } else if (keys.right.isDown || this.Key_D?.isDown) {
            sprite.body.setVelocityX(this.speed);
            sprite.setFlipX(false);
        }

        // Vertical movement
        if (keys.up.isDown || this.Key_W?.isDown) {
            sprite.body.setVelocityY(-this.speed);
        } else if (keys.down.isDown || this.Key_S?.isDown) {
            sprite.body.setVelocityY(this.speed);
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        sprite.body.velocity.normalize().scale(this.speed);

        // Update the animation last and give left/right/down animations precedence over up animations
        if (keys.left.isDown || keys.right.isDown || keys.down.isDown || this.Key_A?.isDown || this.Key_D?.isDown || this.Key_S?.isDown) {
            sprite.anims.play("player-walk", true);
        } else if (keys.up.isDown || this.Key_W?.isDown) {
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

class TilemapVisibility {
    private shadowLayer: TilemapLayer;
    private activeRoom: Room | null;
    
    constructor(shadowLayer: TilemapLayer) {
        this.shadowLayer = shadowLayer;
        this.activeRoom = null;
    }

    setActiveRoom(room: Room) {
        // We only need to update the tiles if the active room has changed
        if (room !== this.activeRoom) {
            this.setRoomAlpha(room, 0); // Make the new room visible
            if (this.activeRoom) this.setRoomAlpha(this.activeRoom, 0.5); // Dim the old room
            this.activeRoom = room;
        }
    }

    // Helper to set the alpha on all tiles within a room
    setRoomAlpha(room, alpha) {
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

const TILE_MAPPING = {
    BLANK: 20,
    WALL: {
        TOP_LEFT: 3,
        TOP_RIGHT: 4,
        BOTTOM_RIGHT: 23,
        BOTTOM_LEFT: 22,
        TOP: [{ index: 39, weight: 4 }, { index: [57, 58, 59], weight: 1 }],
        LEFT: [{ index: 21, weight: 4 }, { index: [76, 95, 114], weight: 1 }],
        RIGHT: [{ index: 19, weight: 4 }, { index: [77, 96, 115], weight: 1 }],
        BOTTOM: [{ index: 1, weight: 4 }, { index: [78, 79, 80], weight: 1 }]
    },
    FLOOR: [{ index: 6, weight: 9 }, { index: [7, 8, 26], weight: 1 }],
    POT: [{ index: 13, weight: 1 }, { index: 32, weight: 1 }, { index: 51, weight: 1 }],
    DOOR: {
        TOP: [40, 6, 38],
        // prettier-ignore
        LEFT: [
            [40],
            [6],
            [2]
        ],
        BOTTOM: [2, 6, 0],
        // prettier-ignore
        RIGHT: [
            [38],
            [6],
            [0]
        ]
    },
    CHEST: 166,
    STAIRS: 81,
    // prettier-ignore
    TOWER: [
        [186],
        [205]
    ]
};
