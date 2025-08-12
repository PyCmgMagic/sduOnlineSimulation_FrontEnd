import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { MobileError } from "./scenes/mobiles/MobileError.ts";
import { ProductGame } from "./scenes/games/Product/ProductGame.ts";
import { GameEntrance } from "./scenes/GameEntrance.ts";
import { PauseMenu } from "./scenes/PauseMenu.ts";
import { VisionGame } from "./scenes/games/VisionGame.ts";
import { FrontEndGame } from "./scenes/games/FrontEndGame.ts";
import { BackEndGame } from "./scenes/games/Back/BackEndGame.ts";
import {GameSuccessForProduct} from "./scenes/games/Product/GameSuccessForProduct.ts";
import { BackEndGamePop } from "./scenes/games/Back/BackEndGamePop.ts";
import {GameSuccessForBack} from "./scenes/games/Back/GameSuccessForBack.ts";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        // mode: Phaser.Scale.FIT,
        // autoCenter: Phaser.Scale.CENTER_BOTH
    },
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
        VisionGame,
        FrontEndGame,
        BackEndGame,
        GameSuccessForProduct,
        BackEndGamePop,
        GameSuccessForBack,
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
