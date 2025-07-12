import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { MobileError } from "./scenes/mobiles/MobileError.ts";
import { ProductGame } from "./scenes/games/ProductGame.ts";
import { GameEntrance } from "./scenes/GameEntrance.ts";
import { PauseMenu } from "./scenes/PauseMenu.ts";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        MobileError,
        ProductGame,
        GameEntrance,
        PauseMenu,
    ],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 80 },
        }
    }
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
