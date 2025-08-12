export enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

export const TILE_MAPPING = {
    BLANK: 20,
    WALL: {
        TOP_LEFT: 3,
        TOP_RIGHT: 4,
        BOTTOM_RIGHT: 23,
        BOTTOM_LEFT: 22,
        TOP: [{ index: 39, weight: 4 }, { index: [57, 58, 59], weight: 1 }],
        LEFT: [{ index: 21, weight: 4 }, { index: [76, 95, 114], weight: 1 }],
        RIGHT: [{ index: 19, weight: 4 }, { index: [77, 96, 115], weight: 1 }],
        BOTTOM: [{ index: 1, weight: 4 }, { index: [78, 79, 80], weight: 1 }]
    },
    FLOOR: [{ index: 6, weight: 9 }, { index: [7, 8, 26], weight: 1 }],
    POT: [{ index: 13, weight: 1 }, { index: 32, weight: 1 }, { index: 51, weight: 1 }],
    DOOR: {
        TOP: [40, 6, 38],
        // prettier-ignore
        LEFT: [
            [40],
            [6],
            [2]
        ],
        BOTTOM: [2, 6, 0],
        // prettier-ignore
        RIGHT: [
            [38],
            [6],
            [0]
        ]
    },
    CHEST: 166,
    STAIRS: 81,
    // prettier-ignore
    TOWER: [
        [186],
        [205]
    ]
};

interface BackGameProperty {
    playerProperty: PlayerProperty,
    enemyProperty: EnemyProperty,
    RoomNumber: number;
}

interface PlayerProperty {
    health: number,
    criticalHitRate: number,
    criticalHitMultiplier: number,
    injuryFreeRate: number,
    minDamage: number,
    damage: number,
    speed: number,
    attackCoolDown: number,
}

interface EnemyProperty {
    speed: number,
    health: number,
    sight_distance: number,
    damage: number,
    minDamage: number,
    criticalHitRate: number,
    criticalHitMultiplier: number,
    injuryFreeRate: number
}

export interface Info {
    title: string,
    content: string;
}

export const infoForIntro: Info = {
    title: '游戏介绍',
    content: '欢迎来到后端开发，在这里，你将成为一名后端开发人员，每探索一个房间将视为你完成一项功能的开发.\n注意房间中存在的Bug怪，用你的能力消灭他们！'
}

export const infoForOperation: Info = {
    title: '操作说明',
    content: '使用WASD控制玩家移动，使用方向键向指定方向发起攻击。\n可是，尽管是强大的后端开发人员，他处理Bug的能力有限，需要等到左下方进度条满时才能进行攻击哦！\n按下E建可以快速打开相关信息面板！'
}

