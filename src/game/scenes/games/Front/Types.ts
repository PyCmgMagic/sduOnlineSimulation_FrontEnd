// 俄罗斯方块形状定义
export interface TetrominoShape {
    shape: number[][];
    color: number;
}

// 游戏状态
export interface GameState {
    board: number[][];
    currentPiece: {
        shape: number[][];
        x: number;
        y: number;
        color: number;
    } | null;
    nextPiece: TetrominoShape | null;
    ghostPiece: {
        shape: number[][];
        x: number;
        y: number;
        color: number;
    } | null;
    heldPiece: TetrominoShape | null;
    canHold: boolean;
    score: number;
    level: number;
    linesCleared: number;
    gameTime: number; // 游戏时间（秒）
    isGameOver: boolean;
    isPaused: boolean;
    clearedBlocksByColor: { [color: number]: number };
}

// 游戏目标接口
export interface GameTargets {
    [color: number]: number; // key是颜色，value是需要完成的目标组数（每5个方块为1组）
}

// 游戏配置常量
export const GAME_CONFIG = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    CELL_SIZE: 22,
    BOARD_OFFSET_X: 360,
    BOARD_OFFSET_Y: 85,
    INITIAL_DROP_INTERVAL: 1000
};

// 俄罗斯方块形状定义
export const TETROMINOES: { [key: string]: TetrominoShape } = {
    I: { shape: [[1, 1, 1, 1]], color: 0xFFB366 }, // 橙色 HTML
    O: { shape: [[1, 1], [1, 1]], color: 0xFFD93D }, // 黄色 CSS
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: 0xFF6B9D }, // 粉色 JS
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 0x87CEEB}, // 蓝色 React
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 0x90EE90  }, // 绿色 Vue
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: 0xFF7F7F  }, // 红色色 性能优化
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: 0xDDA0DD }  // 淡紫色 页面美化
};

// 游戏结果接口
export interface GameResult {
    score: number;
    completionRate: number;
    scoreRate: number;
    time: number;
    progress: Map<number, { current: number, target: number }>;
}

// 弹窗信息接口
export interface Info {
    title: string;
    content: string;
}

// 游戏介绍信息
export const infoForIntro: Info = {
    title: '游戏介绍',
    content: '欢迎来到前端开发，在这里，你将成为一名前端开发人员，通过俄罗斯方块游戏来完成各种前端技术的学习和应用。\n每种颜色的方块代表不同的前端技术，消除对应颜色的方块来完成开发目标！'
};
// 操作说明信息
export const infoForOperation: Info = {
    title: '操作说明',
    content: '使用A/D键或左右方向键移动方块，使用S键或下方向键加速下落，使用W键或上方向键旋转方块，\nE键唤出/关闭弹窗。\n使用空格键暂停游戏，使用C键保持当前方块。\n消除完整行来获得分数，完成各种颜色方块的目标数量来获得胜利！'
};