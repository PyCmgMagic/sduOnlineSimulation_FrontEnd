// Boot场景相关的类型定义

export interface GameStats {
    totalPlayTime: number;
    totalStudents: number;
    totalRevenue: number;
    gamesPlayed: number;
    bestScore: number;
}

export interface PlayerData {
    name: string;
    level: number;
    experience: number;
    achievements: string[];
}

export interface GameSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    difficulty: 'easy' | 'normal' | 'hard';
    language: 'zh-CN' | 'en-US';
}

export interface SavedSettings {
    masterVolume?: number;
    musicVolume?: number;
    sfxVolume?: number;
    difficulty?: 'easy' | 'normal' | 'hard';
    language?: 'zh-CN' | 'en-US';
}

export interface SavedProgress {
    stats?: Partial<GameStats>;
    player?: Partial<PlayerData>;
} 