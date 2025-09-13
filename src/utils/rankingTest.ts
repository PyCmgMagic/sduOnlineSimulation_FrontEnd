import { RankingItem } from './gameApi';

/**
 * 排行榜数据测试工具
 * 用于测试排行榜数据的处理和显示
 */
export class RankingTestUtils {
    
    /**
     * 生成模拟当前金币排行榜数据
     */
    static getMockCoinsRanking(): RankingItem[] {
        return [
            {
                rank: 1,
                userId: 1001,
                username: "编程大神",
                avatar: "https://example.com/avatar1.jpg",
                coins: 99999
            },
            {
                rank: 2,
                userId: 1002,
                username: "代码高手",
                avatar: "https://example.com/avatar2.jpg",
                coins: 88888
            },
            {
                rank: 3,
                userId: 1003,
                username: "算法达人",
                avatar: "https://example.com/avatar3.jpg",
                coins: 77777
            },
            {
                rank: 4,
                userId: 1004,
                username: "项目经理",
                avatar: "https://example.com/avatar4.jpg",
                coins: 66666
            },
            {
                rank: 5,
                userId: 1005,
                username: "全栈工程师",
                avatar: "https://example.com/avatar5.jpg",
                coins: 55555
            },
            {
                rank: 6,
                userId: 1006,
                username: "前端专家",
                avatar: "https://example.com/avatar6.jpg",
                coins: 44444
            },
            {
                rank: 7,
                userId: 1007,
                username: "后端架构师",
                avatar: "https://example.com/avatar7.jpg",
                coins: 33333
            },
            {
                rank: 8,
                userId: 1008,
                username: "数据分析师",
                avatar: "https://example.com/avatar8.jpg",
                coins: 22222
            },
            {
                rank: 9,
                userId: 1009,
                username: "UI设计师",
                avatar: "https://example.com/avatar9.jpg",
                coins: 11111
            },
            {
                rank: 10,
                userId: 1010,
                username: "产品经理",
                avatar: "https://example.com/avatar10.jpg",
                coins: 10000
            }
        ];
    }

    /**
     * 生成模拟最高金币排行榜数据
     */
    static getMockMaxCoinsRanking(): RankingItem[] {
        return [
            {
                rank: 1,
                userId: 1001,
                username: "编程大神",
                avatar: "https://example.com/avatar1.jpg",
                maxCoins: 150000
            },
            {
                rank: 2,
                userId: 1003,
                username: "算法达人",
                avatar: "https://example.com/avatar3.jpg",
                maxCoins: 145000
            },
            {
                rank: 3,
                userId: 1002,
                username: "代码高手",
                avatar: "https://example.com/avatar2.jpg",
                maxCoins: 140000
            },
            {
                rank: 4,
                userId: 1007,
                username: "后端架构师",
                avatar: "https://example.com/avatar7.jpg",
                maxCoins: 135000
            },
            {
                rank: 5,
                userId: 1005,
                username: "全栈工程师",
                avatar: "https://example.com/avatar5.jpg",
                maxCoins: 130000
            },
            {
                rank: 6,
                userId: 1004,
                username: "项目经理",
                avatar: "https://example.com/avatar4.jpg",
                maxCoins: 125000
            },
            {
                rank: 7,
                userId: 1006,
                username: "前端专家",
                avatar: "https://example.com/avatar6.jpg",
                maxCoins: 120000
            },
            {
                rank: 8,
                userId: 1008,
                username: "数据分析师",
                avatar: "https://example.com/avatar8.jpg",
                maxCoins: 115000
            },
            {
                rank: 9,
                userId: 1009,
                username: "UI设计师",
                avatar: "https://example.com/avatar9.jpg",
                maxCoins: 110000
            },
            {
                rank: 10,
                userId: 1010,
                username: "产品经理",
                avatar: "https://example.com/avatar10.jpg",
                maxCoins: 105000
            }
        ];
    }

    /**
     * 生成空排行榜数据（用于测试空状态）
     */
    static getEmptyRanking(): RankingItem[] {
        return [];
    }

    /**
     * 生成少量排行榜数据（用于测试少数据情况）
     */
    static getSmallRanking(): RankingItem[] {
        return [
            {
                rank: 1,
                userId: 1001,
                username: "唯一玩家",
                avatar: "https://example.com/avatar1.jpg",
                coins: 50000,
                maxCoins: 50000
            }
        ];
    }

    /**
     * 验证排行榜数据格式
     */
    static validateRankingData(data: RankingItem[]): boolean {
        if (!Array.isArray(data)) {
            console.error('❌ 排行榜数据不是数组格式');
            return false;
        }

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            
            // 检查必需字段
            if (typeof item.rank !== 'number' || item.rank <= 0) {
                console.error(`❌ 第${i+1}项排名字段无效:`, item.rank);
                return false;
            }
            
            if (typeof item.userId !== 'number' || item.userId <= 0) {
                console.error(`❌ 第${i+1}项用户ID字段无效:`, item.userId);
                return false;
            }
            
            if (typeof item.username !== 'string' || item.username.trim() === '') {
                console.error(`❌ 第${i+1}项用户名字段无效:`, item.username);
                return false;
            }
            
            // 检查金币字段（至少要有一个）
            const hasCoins = typeof item.coins === 'number' && item.coins >= 0;
            const hasMaxCoins = typeof item.maxCoins === 'number' && item.maxCoins >= 0;
            
            if (!hasCoins && !hasMaxCoins) {
                console.error(`❌ 第${i+1}项缺少有效的金币字段`);
                return false;
            }
        }

        console.log('✅ 排行榜数据格式验证通过');
        return true;
    }

    /**
     * 测试排行榜数据排序
     */
    static testRankingSorting(): void {
        console.log('🔍 测试排行榜数据排序...');
        
        const coinsData = this.getMockCoinsRanking();
        const maxCoinsData = this.getMockMaxCoinsRanking();
        
        // 验证当前金币排行榜排序
        for (let i = 0; i < coinsData.length - 1; i++) {
            if (coinsData[i].coins! < coinsData[i + 1].coins!) {
                console.warn(`⚠️ 当前金币排行榜排序异常: 第${i+1}名(${coinsData[i].coins})小于第${i+2}名(${coinsData[i+1].coins})`);
            }
        }
        
        // 验证最高金币排行榜排序
        for (let i = 0; i < maxCoinsData.length - 1; i++) {
            if (maxCoinsData[i].maxCoins! < maxCoinsData[i + 1].maxCoins!) {
                console.warn(`⚠️ 最高金币排行榜排序异常: 第${i+1}名(${maxCoinsData[i].maxCoins})小于第${i+2}名(${maxCoinsData[i+1].maxCoins})`);
            }
        }
        
        console.log('✅ 排行榜排序测试完成');
    }

    /**
     * 在浏览器控制台中暴露测试方法
     */
    static exposeToConsole(): void {
        (window as any).rankingTest = {
            getCoinsData: () => this.getMockCoinsRanking(),
            getMaxCoinsData: () => this.getMockMaxCoinsRanking(),
            getEmptyData: () => this.getEmptyRanking(),
            getSmallData: () => this.getSmallRanking(),
            validate: (data: RankingItem[]) => this.validateRankingData(data),
            testSorting: () => this.testRankingSorting()
        };
        
        console.log('🔧 排行榜测试工具已暴露到控制台:');
        console.log('  - rankingTest.getCoinsData() - 获取模拟当前金币排行榜');
        console.log('  - rankingTest.getMaxCoinsData() - 获取模拟最高金币排行榜');
        console.log('  - rankingTest.getEmptyData() - 获取空排行榜数据');
        console.log('  - rankingTest.getSmallData() - 获取少量排行榜数据');
        console.log('  - rankingTest.validate(data) - 验证排行榜数据格式');
        console.log('  - rankingTest.testSorting() - 测试排行榜排序');
    }
}

export default RankingTestUtils;
