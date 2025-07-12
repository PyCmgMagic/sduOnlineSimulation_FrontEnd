import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameObjects } from "phaser";
import { CommonFunction } from "../../utils/CommonFunction.ts";

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    
    button1: GameObjects.Container;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.cameras.main.setBackgroundColor('#87CEEB'); // 天蓝色背景

        // --- 搭建咖啡馆 ---
        const centerX = this.cameras.main.width / 2;
        const groundY = this.cameras.main.height - 100; // 地面位置
        const cafeScale = 4; // 统一的缩放比例

        // 1. 墙体 (最顶层)
        const wall = this.add.image(centerX, 0, 'houseBeige');
        wall.setOrigin(0.5, 0); // 顶部中心
        const wallImage = this.textures.get('houseBeige');
        const scaleX = this.cameras.main.width / wallImage.source[0].width;
        wall.setScale(scaleX, cafeScale * 1.35);
        wall.setDepth(1);

        // 2. 墙体（下方）
        const wall2Y = wall.y + wall.displayHeight; // wall.displayHeight 是缩放后的高度
        const wall2 = this.add.image(centerX, wall2Y, 'houseDark');
        wall2.setOrigin(0.5, 0); // 顶部中心
        const wallImage2 = this.textures.get('houseDark');
        const scaleX2 = this.cameras.main.width / wallImage2.source[0].width;
        wall2.setScale(scaleX2, cafeScale * 0.45);
        wall2.setDepth(1);
        // 2. 墙体（底部）
        const wall3Y = wall2.y + wall2.displayHeight; // wall.displayHeight 是缩放后的高度
        const wall3 = this.add.image(centerX, wall3Y, 'houseGray');
        wall3.setOrigin(0.5, 0); // 顶部中心
        const wallImage3 = this.textures.get('houseGray');
        const scaleX3 = this.cameras.main.width / wallImage3.source[0].width;
        wall3.setScale(scaleX3, cafeScale * 1.3);
        wall3.setDepth(3);
        // 3. 菜单
        const margin = 20;
        const roofRedMidImage = this.textures.get('roofRedMid');
        const roofRedMidWidth = roofRedMidImage.source[0].width * cafeScale;
        const x = this.cameras.main.width - roofRedMidWidth / 2 - margin;
        const y = margin;

        const roofRedMid = this.add.image(x, y, 'roofRedMid');
        roofRedMid.setOrigin(0.5, 0); // 顶部中心
        roofRedMid.setScale(cafeScale*0.8, cafeScale * 1.5);
        roofRedMid.setDepth(3);

        // 添加客户角色
        const femaleCustomer = this.add.sprite(200, 550, 'female-customer', 0);
        femaleCustomer.setScale(5);
        femaleCustomer.setDepth(4);

        const playerCustomer = this.add.sprite(600, 400, 'player-customer', 0);
        playerCustomer.setScale(4);
        playerCustomer.setFlipX(true); // 水平翻转
        playerCustomer.setDepth(2);
        //按钮
        const buttonX = this.cameras.main.width - 150; // 距离右边150像素
        const buttonY = this.cameras.main.height - 50; // 距离底部100像素
        const button = CommonFunction.createButton(this, buttonX, buttonY, 'button-normal', 'button-pressed', '进入游戏', 5, () => {
           this.scene.start('GameEntrance');
        });
        button.setScale(1.2);
        button.setDepth(5);

        // 创建动画 
        this.anims.create({
            key: 'female-walk-down',
            frames: this.anims.generateFrameNumbers('female-customer', { start: 0, end: 8 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'female-walk-left',
            frames: this.anims.generateFrameNumbers('female-customer', { start: 9, end: 17 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'female-walk-right',
            frames: this.anims.generateFrameNumbers('female-customer', { start: 18, end: 23 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-down',
            frames: this.anims.generateFrameNumbers('player-customer', { start: 0, end: 8 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-left',
            frames: this.anims.generateFrameNumbers('player-customer', { start: 9, end: 17 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk-right',
            frames: this.anims.generateFrameNumbers('player-customer', { start: 18, end: 23 }),
            frameRate: 6,
            repeat: -1
        });

        // // 播放动画 
        // femaleCustomer.play('female-walk-right');
        // playerCustomer.play('player-walk-left');
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
    
    private startGame() {
        this.scene.start('GameEntrance');
    }
}
