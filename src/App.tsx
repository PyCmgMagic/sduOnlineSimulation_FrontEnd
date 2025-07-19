import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { AntdConfigProvider } from './antd-config';
import 'antd/dist/reset.css'; 

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const currentScene = (scene: Phaser.Scene) => {
        // 场景切换回调
    }

    return (
        <AntdConfigProvider>
            <div id="app">
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            </div>
        </AntdConfigProvider>
    )
}

export default App
