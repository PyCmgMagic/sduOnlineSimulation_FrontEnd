import React, { useRef, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from '../PhaserGame';

interface GamePageProps {
    skipBootAnimation?: boolean;
}

const GamePage: React.FC<GamePageProps> = ({ skipBootAnimation = false }) => {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    useEffect(() => {
        // 如果需要跳过启动动画，设置全局标记
        if (skipBootAnimation) {
            console.log('🚀 Setting skip boot animation flag');
            (window as any).skipBootAnimation = true;
            
            // 设置一个临时的登录状态标记
            localStorage.setItem('skipBootAnimation', 'true');
            
            // 5秒后清除标记，避免影响后续的正常访问
            setTimeout(() => {
                localStorage.removeItem('skipBootAnimation');
                (window as any).skipBootAnimation = false;
            }, 5000);
        }
    }, [skipBootAnimation]);

    const currentScene = (scene: Phaser.Scene) => {
        // 场景切换回调
        console.log('🎮 Current scene:', scene.scene.key);
    };

    return (
        <div id="game-page">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
    );
};

export default GamePage;
