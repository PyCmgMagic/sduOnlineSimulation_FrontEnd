import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Login } from './scenes/Login';
import { UserProfile } from './scenes/UserProfile';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { MobileError } from "./scenes/mobiles/MobileError.ts";
import { ProductGame } from "./scenes/games/Product/ProductGame.ts";
import { GameEntrance } from "./scenes/GameEntrance.ts";
import { PauseMenu } from "./scenes/PauseMenu.ts";
import { VisionGame } from "./scenes/games/VisionGame.ts";
import { FrontEndGame } from "./scenes/games/Front/FrontEndGame.ts";
import { FrontEndGamePop } from "./scenes/games/Front/FrontEndGamePop.ts";
import { GameSuccessForFront } from "./scenes/games/Front/GameSuccessForFront.ts";
import { BackEndGame } from "./scenes/games/Back/BackEndGame.ts";
import {GameSuccessForProduct} from "./scenes/games/Product/GameSuccessForProduct.ts";
import { BackEndGamePop } from "./scenes/games/Back/BackEndGamePop.ts";
import {GameSuccessForBack} from "./scenes/games/Back/GameSuccessForBack.ts";
import ApiTestUtils from "../utils/apiTest";
import ApiDataTestUtils from "../utils/apiDataTest";
import RankingTestUtils from "../utils/rankingTest";

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
        Login,
        MainMenu,
        UserProfile,
        MainGame,
        GameOver,
        MobileError,
        ProductGame,
        GameEntrance,
        PauseMenu,
        VisionGame,
        FrontEndGame,
        FrontEndGamePop,
        GameSuccessForFront,
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

    // 初始化API测试工具（仅在开发环境）
    if (import.meta.env.DEV) {
        ApiTestUtils.exposeToConsole();
        ApiDataTestUtils.exposeToConsole();
        RankingTestUtils.exposeToConsole();
    }

    return new Game({ ...config, parent });

}

export default StartGame;
