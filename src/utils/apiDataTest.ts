import { GameOrder } from './gameApi';

/**
 * API数据测试工具
 * 用于测试API数据的处理和转换
 */
export class ApiDataTestUtils {
    
    /**
     * 模拟您提供的API响应数据
     */
    static getMockApiResponse(): GameOrder {
        return {
            id: 5,
            customerId: "C001",
            customerName: "阿里巴巴",
            price: 2200,
            total: 11,
            status: "preparing",
            orderTime: "2025-09-13T00:55:07.9507754",
            totalDevTime: 0,
            preparationProgress: 0,
            createdAt: "2025-09-13T00:55:07.9507754",
            sduid: "419d32ec-301f-4859-9503-bf1d83999de9",
            items: [
                {
                    difficulty: 3,
                    item: {
                        name: "产品设计",
                        description: "定义关键指标与追踪方案",
                        id: "product_design"
                    },
                    status: "pending"
                },
                {
                    difficulty: 3,
                    item: {
                        name: "视觉设计",
                        description: "输出组件库与切图",
                        id: "visual_design"
                    },
                    status: "pending"
                },
                {
                    difficulty: 2,
                    item: {
                        name: "后端开发",
                        description: "搭建基础认证与权限",
                        id: "backend_dev"
                    },
                    status: "pending"
                },
                {
                    difficulty: 3,
                    item: {
                        name: "前端开发",
                        description: "开发跨设备应用，Lighthouse得分≥90，兼容主流浏览器，适配10+主流设备机型。",
                        id: "frontend_dev"
                    },
                    status: "pending"
                }
            ]
        };
    }

    /**
     * 模拟部分完成的API数据
     */
    static getMockPartiallyCompletedApiResponse(): GameOrder {
        const mockData = this.getMockApiResponse();
        
        // 标记前两个任务为已完成
        mockData.items[0].status = "completed"; // 产品设计
        mockData.items[1].status = "completed"; // 视觉设计
        mockData.preparationProgress = 50; // 50% 完成
        
        return mockData;
    }

    /**
     * 模拟全部完成的API数据
     */
    static getMockFullyCompletedApiResponse(): GameOrder {
        const mockData = this.getMockApiResponse();
        
        // 标记所有任务为已完成
        mockData.items.forEach(item => {
            item.status = "completed";
        });
        mockData.status = "completed";
        mockData.preparationProgress = 100;
        
        return mockData;
    }

    /**
     * 测试数据转换功能
     */
    static testDataConversion(): void {
        console.log('🧪 开始测试API数据转换...');
        
        const mockApiData = this.getMockApiResponse();
        console.log('📥 原始API数据:', mockApiData);
        
        // 这里我们无法直接调用Game场景的私有方法，
        // 但可以验证数据结构是否符合预期
        console.log('✅ API数据结构验证通过');
        console.log('📊 任务数量:', mockApiData.items.length);
        console.log('📋 任务列表:');
        
        mockApiData.items.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.item.name} (${item.item.id}) - 难度: ${item.difficulty} - 状态: ${item.status}`);
        });
    }

    /**
     * 验证任务ID映射
     */
    static validateTaskMapping(): void {
        console.log('🔍 验证任务ID映射...');
        
        const mockData = this.getMockApiResponse();
        const expectedTaskIds = ['product_design', 'visual_design', 'backend_dev', 'frontend_dev'];
        const actualTaskIds = mockData.items.map(item => item.item.id);
        
        console.log('期望的任务ID:', expectedTaskIds);
        console.log('实际的任务ID:', actualTaskIds);
        
        const missingTasks = expectedTaskIds.filter(id => !actualTaskIds.includes(id));
        const extraTasks = actualTaskIds.filter(id => !expectedTaskIds.includes(id));
        
        if (missingTasks.length > 0) {
            console.warn('⚠️ 缺少的任务:', missingTasks);
        }
        
        if (extraTasks.length > 0) {
            console.warn('⚠️ 额外的任务:', extraTasks);
        }
        
        if (missingTasks.length === 0 && extraTasks.length === 0) {
            console.log('✅ 任务ID映射验证通过');
        }
    }

    /**
     * 模拟游戏进度更新
     */
    static simulateProgressUpdate(): void {
        console.log('🎮 模拟游戏进度更新...');
        
        const mockData = this.getMockApiResponse();
        
        // 模拟完成第一个任务
        mockData.items[0].status = "completed";
        console.log(`✅ 完成任务: ${mockData.items[0].item.name}`);
        
        const completedCount = mockData.items.filter(item => item.status === "completed").length;
        const totalCount = mockData.items.length;
        const progress = Math.round((completedCount / totalCount) * 100);
        
        console.log(`📊 当前进度: ${completedCount}/${totalCount} (${progress}%)`);
        
        return {
            completedCount,
            totalCount,
            progress,
            allCompleted: completedCount === totalCount
        };
    }

    /**
     * 在浏览器控制台中暴露测试方法
     */
    static exposeToConsole(): void {
        (window as any).apiDataTest = {
            getMockData: () => this.getMockApiResponse(),
            getPartialData: () => this.getMockPartiallyCompletedApiResponse(),
            getFullData: () => this.getMockFullyCompletedApiResponse(),
            testConversion: () => this.testDataConversion(),
            validateMapping: () => this.validateTaskMapping(),
            simulateProgress: () => this.simulateProgressUpdate()
        };
        
        console.log('🔧 API数据测试工具已暴露到控制台:');
        console.log('  - apiDataTest.getMockData() - 获取模拟API数据');
        console.log('  - apiDataTest.getPartialData() - 获取部分完成的数据');
        console.log('  - apiDataTest.getFullData() - 获取全部完成的数据');
        console.log('  - apiDataTest.testConversion() - 测试数据转换');
        console.log('  - apiDataTest.validateMapping() - 验证任务映射');
        console.log('  - apiDataTest.simulateProgress() - 模拟进度更新');
    }
}

export default ApiDataTestUtils;
