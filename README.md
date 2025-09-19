# 学线模拟经营 - 前端项目

[后端仓库](https://github.com/Hanserprpr/sduonline_simulation) - 学生在线模拟经营-2025暑期项目

## 📖 项目概述

**学线模拟经营**是一款基于Web的模拟经营游戏，专为软件开发教育设计。玩家扮演软件公司老板，通过接收客户订单、管理开发团队、完成各类软件开发任务来经营自己的软件公司。

### 🎯 主要功能和特点

- **多样化开发任务**：包含产品设计、视觉设计、前端开发、后端开发、移动端开发等多个专业领域
- **互动式小游戏**：每个开发任务都对应一个专门设计的小游戏
- **排行榜系统**：支持金币排行榜，增强竞争性和趣味性
- **订单管理**：动态订单生成、客户满意度评价

### 🛠️ 技术栈说明

- **前端框架**：React 19.0.0 + TypeScript
- **游戏引擎**：Phaser 3.90.0
- **UI组件库**：Ant Design 5.26.5
- **路由管理**：React Router DOM 7.8.2
- **HTTP客户端**：Axios 1.10.0
- **构建工具**：Vite 6.3.6
- **代码规范**：ESLint + TypeScript ESLint
- **地图生成**：@mikewesthad/dungeon 2.0.1（用于后端开发游戏的地牢生成）

## 🔧 环境要求

### 系统要求
- **操作系统**：Windows 10/11、macOS 10.15+、Linux（Ubuntu 18.04+）
- **浏览器**：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+
- **Node.js**：16.0.0 或更高版本
- **npm**：7.0.0 或更高版本


### 基本操作说明

#### 游戏流程
1. **主菜单**：查看排行榜、个人资料、开始游戏
2. **接收订单**：系统自动生成客户订单，包含不同类型的开发任务
3. **完成任务**：点击订单进入对应的开发小游戏
4. **获得奖励**：完成任务获得金币和经验值

#### 小游戏说明
- **产品设计游戏**：合成大西瓜改
- **视觉设计游戏**：欧拉回路绘制游戏，锻炼逻辑思维
- **前端开发游戏**：俄罗斯方块变体，模拟前端布局和组件组合
- **后端开发游戏**：地牢探索游戏，消灭Bug怪物，完成功能开发
- **移动端开发游戏**：复用前端开发游戏机制

## 📁 项目结构

```
sduOnlineSimulation_FrontEnd/
├── public/                          # 静态资源目录
│   ├── assets/                      # 游戏资源文件
│   │   ├── Tiles/                   # 瓦片图资源
│   │   ├── audio/                   # 音频文件
│   │   ├── customer/                # 客户相关图片
│   │   ├── games/                   # 游戏场景图片
│   │   ├── mobiles/                 # 移动端相关资源
│   │   └── ui/                      # UI界面图片
│   └── favicon.png                  # 网站图标
├── src/                             # 源代码目录
│   ├── components/                  # React组件
│   │   ├── GamePage.tsx             # 游戏页面组件
│   │   ├── LoginCallback.tsx        # 登录回调组件
│   │   └── index.ts                 # 组件导出文件
│   ├── game/                        # Phaser游戏相关代码
│   │   ├── scenes/                  # 游戏场景
│   │   │   ├── Boot.ts              # 启动场景
│   │   │   ├── Preloader.ts         # 资源预加载场景
│   │   │   ├── Login.ts             # 登录场景
│   │   │   ├── MainMenu.ts          # 主菜单场景
│   │   │   ├── Game.ts              # 主游戏场景
│   │   │   ├── UserProfile.ts       # 用户资料场景
│   │   │   ├── GameEntrance.ts      # 游戏入口场景
│   │   │   └── games/               # 各类小游戏场景
│   │   │       ├── Product/         # 产品设计游戏
│   │   │       ├── Front/           # 前端开发游戏
│   │   │       ├── Back/            # 后端开发游戏
│   │   │       └── VisionGame.ts    # 视觉设计游戏
│   │   ├── systems/                 # 游戏系统（如有）
│   │   ├── types/                   # 类型定义
│   │   ├── EventBus.ts              # 事件总线
│   │   └── main.ts                  # 游戏主入口
│   ├── utils/                       # 工具函数
│   │   ├── CommonFunction.ts        # 通用函数
│   │   ├── gameApi.ts               # 游戏API接口
│   │   ├── request.ts               # HTTP请求封装
│   │   └── apiTest.ts               # API测试工具
│   ├── App.tsx                      # React应用主组件
│   ├── main.tsx                     # React应用入口
│   ├── PhaserGame.tsx               # Phaser游戏React包装组件
│   └── antd-config.tsx              # Ant Design配置
├── vite/                            # Vite配置文件
│   ├── config.dev.mjs               # 开发环境配置
│   └── config.prod.mjs              # 生产环境配置
├── package.json                     # 项目依赖和脚本配置
├── tsconfig.json                    # TypeScript配置
├── vite.config.ts                   # Vite主配置文件
├── eslint.config.js                 # ESLint配置
└── README.md                        # 项目说明文档
```

## 📄 许可证信息
### 使用许可
本项目采用 **MIT License** 开源许可证。

详细许可证内容请查看 [LICENSE](./LICENSE) 文件。

---
