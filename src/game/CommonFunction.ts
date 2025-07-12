import {GameObjects, Scene} from "phaser";



export class CommonFunction 
{
    /**
     * create button
     * @param scene - the current scene
     * @param x - the x position of the button
     * @param y - the y position of the button
     * @param key - the kay-name of a pic
     * @param key_pressed - the key-name of a pic when the button is pressed
     * @param text - the text of the button
     * @param depth - the depth of the button
     * @param callback - the callback function of the button
     * @returns the button object
     */
    public static createButton(
        scene: Scene, 
        x: number, 
        y: number, 
        key: string, 
        key_pressed: string,
        text: string,
        depth: number,
        callback: () => void
    ): GameObjects.Container {
        const container: GameObjects.Container = scene.add.container(x, y);
        
        // the bg of the button
        const buttonBg = scene.add.image(0, 0, key);
        buttonBg.setScale(1.2);
        
        // some decoration
        // TODO add some code into the function to add some decoration aimed at improve the function's usability
        
        // the text of the buttton
        const buttonText = scene.add.text(0, 0, text, {
            fontFamily: 'Arial Black, SimHei, Microsoft YaHei',
            fontSize: 20,
            color: '#5D4037',
            stroke: '#FFF',
            strokeThickness: 2,
            align: 'center',
        }).setOrigin(0.5);
        container.add([buttonBg, buttonText]);
        container.setDepth(depth);
        container.setSize(buttonBg.width * 1.2, buttonBg.height * 1.2);
        
        container.setInteractive();
        
        container.on('pointerover', () => {
            scene.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: "Power2"
            })
        })
        
        container.on('pointerout', () => {
            scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: "Power2"
            })    
            
            scene.tweens.add({
                targets: buttonBg,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            })
        })
        
        container.on("pointerdown", () => {
            buttonBg.setTexture(key_pressed);
            
            scene.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Power2'
            })
        })
        
        container.on('pointerup', () => {
            buttonBg.setTexture(key);
            
            scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power2'
            })
            
            callback();
            
        })
        
        return container;
        
    }

    /**
     * create a background of a scene
     * @param scene - the current scene
     * @param x - the x position of the background
     * @param y - the y position of the background
     * @param key - the key-name of a pic as a background
     * 
     */
    public static createBackground(
        scene: Scene,
        x: number,
        y: number,
        key: string
    ): GameObjects.Image {
        const background = scene.add.image(x, y, key);
        // full-screen background
        const scaleX = scene.cameras.main.width / background.width;
        const scaleY = scene.cameras.main.height / background.height;
        const scale = Math.max(scaleX, scaleY);
        background.setScale(scale);
        
        return background;
    }
}