// Preloader场景相关的类型定义

export interface LoadingProgress {
    progress: number;
    totalAssets: number;
    loadedAssets: number;
    currentAsset: string;
}

export interface ColorTheme {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    text: string;
    textSecondary: string;
}

export interface AudioManager {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    playMusic: (key: string) => void;
    playSound: (key: string) => void;
}

export interface ParticleManager {
    createExplosion: (x: number, y: number) => void;
    createStars: (x: number, y: number) => void;
}

export interface AssetConfig {
    key: string;
    url: string;
    type: 'image' | 'audio' | 'spritesheet' | 'font';
    config?: any;
}

export interface LoadingState {
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    completedAt?: number;
} 