import GameApiService from './gameApi';

/**
 * API测试工具类
 * 用于测试各个API接口的连通性和功能
 */
export class ApiTestUtils {
    
    /**
     * 测试所有API接口
     */
    static async testAllApis(): Promise<void> {
        console.log('🧪 开始API测试...');
        
        try {
            // 测试用户信息接口
            await this.testGetUserInfo();
            
            // 测试用户ID接口
            await this.testGetUserId();
            
            // 测试游戏开始接口
            await this.testBeginGame();
            
            // 测试游戏状态更新接口
            await this.testUpdateGameStatus();

            // 测试排行榜接口
            await this.testRankingApis();

            console.log('✅ 所有API测试完成');
            
        } catch (error) {
            console.error('❌ API测试过程中出现错误:', error);
        }
    }
    
    /**
     * 测试获取用户信息接口
     */
    static async testGetUserInfo(): Promise<void> {
        try {
            console.log('📝 测试 /api/me 接口...');
            const userInfo = await GameApiService.getUserInfo();
            console.log('✅ 用户信息获取成功:', userInfo);
        } catch (error) {
            console.warn('⚠️ 用户信息获取失败:', error);
        }
    }
    
    /**
     * 测试获取用户ID接口
     */
    static async testGetUserId(): Promise<void> {
        try {
            console.log('🆔 测试 /api/getId 接口...');
            const userId = await GameApiService.getUserId();
            console.log('✅ 用户ID获取成功:', userId);
        } catch (error) {
            console.warn('⚠️ 用户ID获取失败:', error);
        }
    }
    
    /**
     * 测试游戏开始接口
     */
    static async testBeginGame(): Promise<void> {
        try {
            console.log('🎮 测试 /api/progress/begin 接口...');
            const gameOrder = await GameApiService.beginGame('frontend_dev');
            console.log('✅ 游戏开始成功:', gameOrder);
            
            // 保存订单ID用于后续测试
            (window as any).testOrderId = gameOrder.id;
            
        } catch (error) {
            console.warn('⚠️ 游戏开始失败:', error);
        }
    }
    
    /**
     * 测试游戏状态更新接口
     */
    static async testUpdateGameStatus(): Promise<void> {
        try {
            console.log('🔄 测试 /api/progress/update-game-status 接口...');
            
            // 使用之前保存的订单ID，如果没有则使用默认值
            const orderId = (window as any).testOrderId || 1;
            
            const updateData = {
                items: JSON.stringify([{
                    item: {
                        id: 'frontend_dev',
                        name: '前端开发',
                        description: '前端开发任务'
                    },
                    status: 'completed',
                    difficulty: 3,
                    score: 85
                }]),
                status: 'finish',
                preparationProgress: 100
            };
            
            const updatedOrder = await GameApiService.updateGameStatus(orderId, updateData);
            console.log('✅ 游戏状态更新成功:', updatedOrder);
            
        } catch (error) {
            console.warn('⚠️ 游戏状态更新失败:', error);
        }
    }
    
    /**
     * 测试排行榜接口
     */
    static async testRankingApis(): Promise<void> {
        try {
            console.log('🏆 测试排行榜接口...');

            // 测试当前金币排行榜
            console.log('📊 测试 /rank/coins 接口...');
            const coinsRanking = await GameApiService.getCoinsRanking(5);
            console.log('✅ 当前金币排行榜获取成功:', coinsRanking);

            // 测试最高金币排行榜
            console.log('📊 测试 /rank/max-coins 接口...');
            const maxCoinsRanking = await GameApiService.getMaxCoinsRanking(5);
            console.log('✅ 最高金币排行榜获取成功:', maxCoinsRanking);

        } catch (error) {
            console.warn('⚠️ 排行榜接口测试失败:', error);
        }
    }

    /**
     * 在浏览器控制台中暴露测试方法
     */
    static exposeToConsole(): void {
        (window as any).apiTest = {
            testAll: () => this.testAllApis(),
            testUserInfo: () => this.testGetUserInfo(),
            testUserId: () => this.testGetUserId(),
            testBegin: (sub?: string) => this.testBeginGame(),
            testUpdate: () => this.testUpdateGameStatus(),
            testRanking: () => this.testRankingApis()
        };

        console.log('🔧 API测试工具已暴露到控制台:');
        console.log('  - apiTest.testAll() - 测试所有API');
        console.log('  - apiTest.testUserInfo() - 测试用户信息API');
        console.log('  - apiTest.testUserId() - 测试用户ID API');
        console.log('  - apiTest.testBegin(sub?) - 测试游戏开始API');
        console.log('  - apiTest.testUpdate() - 测试游戏状态更新API');
        console.log('  - apiTest.testRanking() - 测试排行榜API');
    }
}

export default ApiTestUtils;
