import request from './request';

// 定义接口类型
export interface GameOrder {
    id: number;
    customerId: string;
    customerName: string;
    price: number;
    total: number;
    status: string;
    orderTime: string;
    totalDevTime: number;
    preparationProgress: number;
    createdAt: string;
    sduid: string;
    items: GameOrderItem[];
}

export interface GameOrderItem {
    difficulty: number;
    item: {
        id: string;
        name: string;
        description: string;
    };
    status: string;
}

export interface ApiResponse<T> {
    code: number;
    data: T;
    msg: string;
}

export interface RankingItem {
    rank: number;
    userId: number;
    username: string;
    avatar: string;
    coins?: number;      // 当前金币数（用于 /rank/coins）
    maxCoins?: number;   // 历史最高金币数（用于 /rank/max-coins）
}

/**
 * 游戏API服务类
 */
export class GameApiService {
    
    /**
     * 开始游戏 - 调用 /api/progress/begin
     * @param sub 可选的子项目标识
     * @returns 返回游戏订单数据
     */
    static async beginGame(sub?: string): Promise<GameOrder> {
        try {
            console.log('🎮 开始游戏，调用 /api/progress/begin', { sub });

            const params: Record<string, string> = {};
            if (sub) {
                params.sub = sub;
            }

            const response = await request.post<GameOrder>('/api/progress/begin', null, {
                params
            });

            console.log('✅ 游戏开始成功:', response);
            return response;
        } catch (error) {
            console.error('❌ 游戏开始失败:', error);
            throw new Error(`游戏开始失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    
    /**
     * 更新游戏状态 - 调用 /api/progress/update-game-status
     * @param orderId 订单ID（必需）
     * @param updateData 要更新的数据
     * @returns 返回更新后的游戏订单数据
     */
    static async updateGameStatus(
        orderId: number,
        updateData: {
            items?: string;           // JSON字符串格式的items数据
            total?: number;           // 总价
            status?: string;          // 状态
            orderTime?: string;       // 订单时间
            totalDevTime?: number;    // 总开发时间
            preparationProgress?: number; // 准备进度
        }
    ): Promise<GameOrder> {
        try {
            console.log('🔄 更新游戏状态，调用 /api/progress/update-game-status', { 
                orderId, 
                updateData 
            });
            
            const params: Record<string, string | number> = {
                orderId
            };
            
            // 添加可选参数
            if (updateData.items !== undefined) params.items = updateData.items;
            if (updateData.total !== undefined) params.total = updateData.total;
            if (updateData.status !== undefined) params.status = updateData.status;
            if (updateData.orderTime !== undefined) params.orderTime = updateData.orderTime;
            if (updateData.totalDevTime !== undefined) params.totalDevTime = updateData.totalDevTime;
            if (updateData.preparationProgress !== undefined) params.preparationProgress = updateData.preparationProgress;
            
            const response = await request.post<GameOrder>('/api/progress/update-game-status', null, {
                params
            });
            
            console.log('✅ 游戏状态更新成功:', response);
            return response;
        } catch (error) {
            console.error('❌ 游戏状态更新失败:', error);
            throw new Error(`游戏状态更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    
    /**
     * 获取用户信息 - 调用 /api/me
     * @returns 返回用户信息
     */
    static async getUserInfo(): Promise<any> {
        try {
            console.log('👤 获取用户信息，调用 /api/me');
            
            const response = await request.get<any>('/api/me');
            
            console.log('✅ 用户信息获取成功:', response);
            return response;
        } catch (error) {
            console.error('❌ 用户信息获取失败:', error);
            throw new Error(`用户信息获取失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    
    /**
     * 获取用户ID - 调用 /api/getId
     * @returns 返回用户ID
     */
    static async getUserId(): Promise<string> {
        try {
            console.log('🆔 获取用户ID，调用 /api/getId');

            const response = await request.get<string>('/api/getId');

            console.log('✅ 用户ID获取成功:', response);
            return response;
        } catch (error) {
            console.error('❌ 用户ID获取失败:', error);
            throw new Error(`用户ID获取失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 获取金币排行榜 - 调用 /rank/coins
     * @param limit 可选的限制数量
     * @returns 返回金币排行榜数据
     */
    static async getCoinsRanking(limit?: number): Promise<RankingItem[]> {
        try {
            console.log('🏆 获取金币排行榜，调用 /rank/coins', { limit });

            const params: Record<string, any> = {};
            if (limit) {
                params.limit = limit;
            }

            const response = await request.get<RankingItem[]>('/rank/coins', {
                params
            });

            console.log('✅ 金币排行榜获取成功:', response);
            return response;
        } catch (error) {
            console.error('❌ 金币排行榜获取失败:', error);
            throw new Error(`金币排行榜获取失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 获取最高金币排行榜 - 调用 /rank/max-coins
     * @param limit 可选的限制数量
     * @returns 返回最高金币排行榜数据
     */
    static async getMaxCoinsRanking(limit?: number): Promise<RankingItem[]> {
        try {
            console.log('🏆 获取最高金币排行榜，调用 /rank/max-coins', { limit });

            const params: Record<string, any> = {};
            if (limit) {
                params.limit = limit;
            }

            const response = await request.get<RankingItem[]>('/rank/max-coins', {
                params
            });

            console.log('✅ 最高金币排行榜获取成功:', response);
            return response;
        } catch (error) {
            console.error('❌ 最高金币排行榜获取失败:', error);
            throw new Error(`最高金币排行榜获取失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
}

export default GameApiService;
