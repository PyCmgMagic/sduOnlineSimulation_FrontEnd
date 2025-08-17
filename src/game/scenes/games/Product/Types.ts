export const introduction: string = "游戏介绍\n" +
    "欢迎来到产品大冒险！这是一场充满乐趣与挑战的产品设计之旅！\n" +
    "在游戏里，你将扮演一位超级厉害的产品设计师，将用户的想法合成并提炼为需求文档中的各种文字与图片内容。其实这就是产品设计部同学日常工作的一部分哦！\n" +
    "游戏中有八种不同的元素，每个元素代表产品设计过程中不同的部分。不管是哪一部分，都在需求文档中扮演非常重要的角色。你要巧妙地将相同的元素碰撞在一起，从而合成更完整更高级的部分，最终构思出完整产品，产出产品的需求文档，以供技术的同学进行开发。" +
    "在游戏过程中，你还得时刻关注用时，争取用最短的时间完成任务，因为高效率工作也是成为顶尖产品设计师必不可缺的优点哦！快来冒险吧！"

export const operation: string = '🎮游戏操作 '+
    '\u3000🚶‍♂️使用键盘的方向键或A/D或←/→键控制玩家移动。\n' +
    '\u3000🪄点击空格键开始放置想法。\n' +
    '\u3000🔥将相同的想法碰撞在一起，擦出火花，形成更高级的构思。\n' +
    '\u3000⭐注意时间，争取用最短的时间完成任务！'

// read-only
export const FRUITS_TYPES: string[] = ['game-product-fruit1', 'game-product-fruit2', 'game-product-fruit3', 'game-product-fruit4', 'game-product-fruit5', 'game-product-fruit6', 'game-product-fruit7', 'game-product-fruit8', 'game-product-bad-fruit'];

export interface ProductGameProperties {
    DIFFICULTY: number;
    player_move_speed: number;
    PROBABILITY: number[];
    BAD_FRUIT_RADIUS: number | null;
    BAD_FRUIT_KEY: string | null;
}

export const ProductGameProperties: ProductGameProperties[] = [
    {
        DIFFICULTY: 1,
        player_move_speed: 4,
        PROBABILITY: [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0],
        BAD_FRUIT_RADIUS: null,
        BAD_FRUIT_KEY: null,    
    },
    {
        DIFFICULTY: 2,
        player_move_speed: 2,
        PROBABILITY: [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0],
        BAD_FRUIT_RADIUS: null,
        BAD_FRUIT_KEY: null,
    },
    {
        DIFFICULTY: 3,
        player_move_speed: 1,
        PROBABILITY: [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0],
        BAD_FRUIT_RADIUS: null,
        BAD_FRUIT_KEY: null,    
    },
    {
        DIFFICULTY: 4,
        player_move_speed: 1,
        PROBABILITY: [0.5, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0],
        BAD_FRUIT_RADIUS: null,
        BAD_FRUIT_KEY: null,    
    },
    {
        DIFFICULTY: 5,
        player_move_speed: 1,
        PROBABILITY: [0.45, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.05],
        BAD_FRUIT_RADIUS: 20,
        BAD_FRUIT_KEY: 'game-product-bad-fruit-1',    
    },
    {
        DIFFICULTY: 6,
        player_move_speed: 1,
        PROBABILITY: [0.4, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.1],
        BAD_FRUIT_RADIUS: 28,
        BAD_FRUIT_KEY: 'game-product-bad-fruit-2',    
    },
    {
        DIFFICULTY: 7,
        player_move_speed: 1,
        PROBABILITY: [0.35, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.15],
        BAD_FRUIT_RADIUS: 32,
        BAD_FRUIT_KEY: 'game-product-bad-fruit-3',    
    },
    {
        DIFFICULTY: 8,
        player_move_speed: 1,
        PROBABILITY: [0.3, 0.3, 0.1, 0.1, 0, 0, 0, 0, 0.2],
        BAD_FRUIT_RADIUS: 44,
        BAD_FRUIT_KEY: 'game-product-bad-fruit-4',    
    }
]
