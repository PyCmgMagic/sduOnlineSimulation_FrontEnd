import { Scene } from "phaser";
import {CustomerOrder} from "../Game.ts";
import {CommonFunction} from "../../../utils/CommonFunction.ts";

type Edge = [number, number];
interface EulerLevel {
    edges: Edge[];
    start: number;
    end: number;
}
interface TreeResult {
    edges: Edge[];
    adjSet: Set<number>[];
}

export class VisionGame extends Scene
{
    private currentOrder: CustomerOrder;
    private DIFFICULTY: number; // 难度设计为1-15
    private pointNumArr: number[] = CommonFunction.range(5, 20);
    private maxOffsetArr: number[] = CommonFunction.range(10, 50, 10);
    
    private nodes: Phaser.GameObjects.Graphics[] = [];
    private edges: Phaser.GameObjects.Graphics[] = [];
    private currentLevel: EulerLevel | null = null;
    private currentPath: number[] = [];
    private isDrawing = false;
    private line: Phaser.GameObjects.Graphics | null = null;
    private tempLine: Phaser.GameObjects.Graphics | null = null;
    private pointNumber: number = 5;
    private nodePositions: { x: number, y: number }[] = [];
    private lastNodeIndex: number | null = null;
    private nodeRadius: number = 10;
    private edgeLineWidth: number = 5;
    private vertexRangePadding: number = 10;
    private vertexRange = {
        minX: 757 + this.vertexRangePadding,
        maxX: 1157 - this.vertexRangePadding,
        minY: 129 + this.vertexRangePadding,
        maxY: 529 - this.vertexRangePadding,
    };
    private maxOffset = 20;
    private nodeColors = {
        normal: 0x5d953c,
        hover: 0x5d953c,
        selected: 0x5d953c
    };
    private edgeColors = {
        normal: Phaser.Display.Color.GetColor(175, 175, 175),
        active: 0x5d953c
    };
    private usedEdges: Set<string> = new Set();
    private score: number = 0;
    private scoreText: Phaser.GameObjects.Text;

    constructor() {
        super({
            key: "VisionGame",
        });
    };
    
    preload() {
        this.load.image("game-vision-background", "assets/games/vision/background.png")
        this.load.image("game-vision-redraw", "assets/games/vision/redraw.png")
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        this.DIFFICULTY = this.currentOrder.difficulty;
        this.pointNumber = this.pointNumArr[this.DIFFICULTY - 1];
        this.maxOffset = this.maxOffsetArr[Math.floor(this.DIFFICULTY / 3)];
        console.log('VisionGame received order:', this.currentOrder);
    };

    create() {
        this.createBackground();
        this.initGameLevel();
        this.createScoreArea();
        this.createIntroductionArea();
        this.createFunctionRectangle();

        // 监听鼠标事件
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerup', this.handlePointerUp, this);
    }

    private drawLevel() {
        if (!this.currentLevel) return;

        this.nodePositions = [];
        const numNodes = this.currentLevel.edges.reduce((max, [u, v]) => Math.max(max, u, v), 0) + 1;

        // 环形布局顶点
        const centerX = (this.vertexRange.minX + this.vertexRange.maxX) / 2;
        const centerY = (this.vertexRange.minY + this.vertexRange.maxY) / 2;
        const radius = Math.min(
            (this.vertexRange.maxX - this.vertexRange.minX) / 2 - this.nodeRadius * 2,
            (this.vertexRange.maxY - this.vertexRange.minY) / 2 - this.nodeRadius * 2
        );

        for (let i = 0; i < numNodes; i++) {
            const angle = (2 * Math.PI * i) / numNodes;
            let x = centerX + radius * Math.cos(angle);
            let y = centerY + radius * Math.sin(angle);

            // 添加随机偏移
            x += Phaser.Math.Between(-this.maxOffset, this.maxOffset);
            y += Phaser.Math.Between(-this.maxOffset, this.maxOffset);

            // 确保顶点在指定范围内
            x = Phaser.Math.Clamp(x, this.vertexRange.minX + this.nodeRadius, this.vertexRange.maxX - this.nodeRadius);
            y = Phaser.Math.Clamp(y, this.vertexRange.minY + this.nodeRadius, this.vertexRange.maxY - this.nodeRadius);

            this.nodePositions.push({x, y});
        }

        /* draw the edges */
        for (const [u, v] of this.currentLevel.edges) {
            const edge = this.add.graphics();
            // 使用分离出的线宽变量，更改颜色
            edge.lineStyle(this.edgeLineWidth, this.edgeColors.normal);
            edge.beginPath();
            edge.moveTo(this.nodePositions[u].x, this.nodePositions[u].y);
            edge.lineTo(this.nodePositions[v].x, this.nodePositions[v].y);
            edge.strokePath();
            this.edges.push(edge);
        }

        /* draw the nodes */
        for (let i = 0; i < numNodes; i++) {
            const node = this.add.graphics();
            node.fillStyle(this.nodeColors.normal, 1);
            // 使用分离出的节点半径变量
            node.fillCircle(this.nodePositions[i].x, this.nodePositions[i].y, this.nodeRadius);
            this.nodes.push(node);

            // 添加节点交互效果
            const hitArea = this.add.circle(
                this.nodePositions[i].x,
                this.nodePositions[i].y,
                this.nodeRadius,
                0x000000,
                0
            ).setInteractive();

            hitArea.on('pointerover', () => {
                node.clear();
                node.fillStyle(this.nodeColors.hover, 1);
                node.fillCircle(this.nodePositions[i].x, this.nodePositions[i].y, this.nodeRadius);
            });

            hitArea.on('pointerout', () => {
                node.clear();
                node.fillStyle(this.nodeColors.normal, 1);
                node.fillCircle(this.nodePositions[i].x, this.nodePositions[i].y, this.nodeRadius);
            });
        }
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (!this.currentLevel) return;

        const nodeRadius = this.nodeRadius;
        for (let i = 0; i < this.nodePositions.length; i++) {
            const nodePos = this.nodePositions[i];
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, nodePos.x, nodePos.y);
            if (distance <= nodeRadius) {
                if (!this.isDrawing) {
                    if (this.lastNodeIndex === null) {
                        // 全新开始绘制
                        this.isDrawing = true;
                        this.currentPath = [i];
                        this.lastNodeIndex = i;
                        this.line = this.add.graphics();
                        // 正确设置线宽、颜色和圆角样式
                        this.line.lineStyle(
                            this.edgeLineWidth, 
                            this.edgeColors.active, 
                            1
                        );
                        this.line.beginPath();
                        this.line.moveTo(nodePos.x, nodePos.y);
                        this.tempLine = this.add.graphics();
                        // 正确设置临时线宽、颜色和圆角样式
                        this.tempLine.lineStyle(
                            this.edgeLineWidth, 
                            this.edgeColors.active, 
                            0.5
                        );
                        this.tempLine.beginPath();
                        this.tempLine.moveTo(nodePos.x, nodePos.y);

                        // 更改节点颜色为选中状态
                        const node = this.nodes[i];
                        node.clear();
                        node.fillStyle(this.nodeColors.selected, 1);
                        node.fillCircle(nodePos.x, nodePos.y, this.nodeRadius);
                    } else if (i !== this.lastNodeIndex) {
                        // 若已选择起点但未画线，允许重新选择起点
                        this.resetDrawing();
                        
                        // 重新开始绘制
                        this.isDrawing = true;
                        this.currentPath = [i];
                        this.lastNodeIndex = i;
                        this.line = this.add.graphics();
                        this.line.lineStyle(
                            this.edgeLineWidth, 
                            this.edgeColors.active, 
                            1
                        );
                        this.line.beginPath();
                        this.line.moveTo(nodePos.x, nodePos.y);
                        this.tempLine = this.add.graphics();
                        this.tempLine.lineStyle(
                            this.edgeLineWidth, 
                            this.edgeColors.active, 
                            0.5
                        );
                        this.tempLine.beginPath();
                        this.tempLine.moveTo(nodePos.x, nodePos.y);

                        // 更改节点颜色为选中状态
                        const node = this.nodes[i];
                        node.clear();
                        node.fillStyle(this.nodeColors.selected, 1);
                        node.fillCircle(nodePos.x, nodePos.y, this.nodeRadius);
                    }
                }
                break;
            }
        }
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing || !this.tempLine || !this.line) return;

        this.tempLine.clear();
        // 正确设置临时线宽、颜色和圆角样式
        this.tempLine.lineStyle(
            this.edgeLineWidth, 
            this.edgeColors.active, 
            0.5,
        );
        this.tempLine.beginPath();
        const lastPos = this.nodePositions[this.lastNodeIndex!];
        this.tempLine.moveTo(lastPos.x, lastPos.y);
        this.tempLine.lineTo(pointer.x, pointer.y);
        this.tempLine.strokePath();

        const nodeRadius = this.nodeRadius;
        for (let i = 0; i < this.nodePositions.length; i++) {
            const nodePos = this.nodePositions[i];
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, nodePos.x, nodePos.y);
            if (distance <= nodeRadius) {
                const lastNode = this.currentPath[this.currentPath.length - 1];
                const edgeExists = this.currentLevel!.edges.some(([u, v]) =>
                    (u === lastNode && v === i) || (u === i && v === lastNode)
                );

                const edgeKey = [lastNode, i].sort((a, b) => a - b).join('-');

                if (edgeExists && i !== lastNode && !this.usedEdges.has(edgeKey)) {
                    this.currentPath.push(i);
                    // 正确设置线宽、颜色和圆角样式
                    this.line.lineStyle(
                        this.edgeLineWidth, 
                        this.edgeColors.active, 
                        1,
                    );
                    this.line.lineTo(nodePos.x, nodePos.y);
                    this.line.strokePath();
                    this.lastNodeIndex = i;
                    this.tempLine.clear();
                    // 正确设置临时线宽、颜色和圆角样式
                    this.tempLine.lineStyle(
                        this.edgeLineWidth, 
                        this.edgeColors.active, 
                        0.5,
                    );
                    this.tempLine.beginPath();
                    this.tempLine.moveTo(nodePos.x, nodePos.y);
                    this.usedEdges.add(edgeKey);

                    // 更改节点颜色为选中状态
                    const node = this.nodes[i];
                    node.clear();
                    node.fillStyle(this.nodeColors.selected, 1);
                    node.fillCircle(nodePos.x, nodePos.y, this.nodeRadius);
                    
                    // 增加分数
                    this.score += 10;
                    this.scoreText.setText(this.score.toString());
                }
                break;
            }
        }
    }
    
    private initGameLevel() {
        /* init game level */
        this.currentLevel = this.generateEulerianLevel(this.pointNumber);

        if (this.currentLevel) {
            this.drawLevel();
        }
    }
    
    private createScoreArea(): void {
        this.add.text(
            163.5,
            594.07,
            "得分：",
            {
                fontSize: '36px',
                color: '#FFF',
                fontFamily: 'Arial',
            }
        );
        this.scoreText = this.add.text(
            280,
            592,
            "0",
            {
                fontSize: '42px',
                color: '#FFF',
                fontFamily: 'Arial',
            }
        );
    }
    
    private createBackground() {
        this.add.image(640, 360, "game-vision-background")
    }
    
    private createIntroductionArea() {
        const introRectWidth = 437; 
        const introRectX = 139; 
        const introRectY = 195; 
        
        const introText = `游戏介绍：
        🎯游戏目标：
        这是一场考验智慧与耐心的一笔画挑战！你要从指定起点出发，像超级探险家一样，不重复地走遍所有路线，最终顺利抵达指定终点。
        🖱️玩法指南：
        1.点击游戏中的节点，开启你的冒险之旅。
        2.按住鼠标并拖动，让路线像魔法线条一样连接各个节点。
        3.松开鼠标，结束当前绘制，看看你是否成功完成挑战。
        4.你可以使用按钮来清除当前绘制以重新开始你的冒险或者重新生成冒险图。`;
        const textStyle = {
            fontSize: '18px',
            fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
            color: '#654321',
            wordWrap: { width: introRectWidth - 20, useAdvancedWrap: true },
            padding: { left: 10, right: 10, top: 10, bottom: 10 }
        };
        this.add.text(introRectX + 10, introRectY, introText, textStyle);
        
        // tips text
        const tipsText = "小提示：按住鼠标不要松手哦~";
        const tipsTextStyle = {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
        }
        this.add.text(850, 62, tipsText, tipsTextStyle)
    }
    
    private createFunctionRectangle() {
        const redrawWidth: number = 46;
        const redrawHeight: number = 51;
        const radius = 35;
        
        const circleBg = this.add.graphics();
        circleBg.fillStyle(0xc4d9b7, 1);
        circleBg.fillCircle(1049, 595, radius);
        
        this.add.text(1033, 650, '重置', {
            fontSize: '18px',
            color: '#fff',
            fontFamily: 'Arial',
        });
    
        // 添加 game-vision-redraw 图片并设置点击事件和 hover 效果
        const redrawImage = this.add.image(1050, 593, 'game-vision-redraw')
            .setDisplaySize(redrawWidth, redrawHeight)
            .setOrigin(0.5)
            .setInteractive(); // 启用交互
        redrawImage.on('pointerdown', () => {
            redrawImage.setDisplaySize(redrawWidth * 0.9, redrawHeight * 0.9);
        });
        redrawImage.on('pointerover', () => {
            redrawImage.setDisplaySize(redrawWidth * 1.1, redrawHeight * 1.1);
            redrawImage.setAlpha(0.9);
        });
        redrawImage.on('pointerout', () => {
            redrawImage.setDisplaySize(redrawWidth, redrawHeight);
            redrawImage.setAlpha(1);
        });
        redrawImage.on('pointerup', () => {
            redrawImage.setDisplaySize(redrawWidth, redrawHeight);
            this.resetDrawing();
        })
    }

    private resetDrawing() {
        // 重置绘制状态
        this.isDrawing = false;
        this.currentPath = [];
        this.lastNodeIndex = null;

        // 清除已使用边的记录
        this.usedEdges.clear();

        // 清除并销毁绘制的线条
        if (this.line) {
            this.line.clear();
            this.line.destroy();
            this.line = null;
        }

        // 清除临时线条
        if (this.tempLine) {
            this.tempLine.clear();
            this.tempLine.destroy();
            this.tempLine = null;
        }
        
        // 重置分数
        this.score = 0;
        this.scoreText.setText(this.score.toString());
    }

    // 新增重新生成欧拉图方法
    private regenerateEulerianLevel() {
        // 清除当前绘制的内容
        this.resetDrawing();
        this.nodes.forEach(node => node.destroy());
        this.edges.forEach(edge => edge.destroy());
        this.nodes = [];
        this.edges = [];

        // 生成新的欧拉图
        this.currentLevel = this.generateEulerianLevel(this.pointNumber);
        if (this.currentLevel) {
            this.drawLevel();
        }
    }

    // 优化后的欧拉路径节点树生成算法
    private generateEulerianLevel(pointNumber: number, maxRetry: number = 10): EulerLevel | null{
        if (pointNumber < 2) throw new Error('顶点数 n 必须至少为 2');

        if (maxRetry <= 0) return null;

        /* 1. 生成随机树 */
        const genTree = this.generateRandomTree(pointNumber);
        if (!genTree) return this.generateEulerianLevel(pointNumber, maxRetry - 1);
        const { edges, adjSet } = genTree;

        /* 2. 初始化度数 */
        const degrees = new Array<number>(pointNumber).fill(0);
        for (const [u, v] of edges) {
            degrees[u]++;
            degrees[v]++;
        }

        /* 辅助：获取当前奇度顶点 */
        const getOddVertices = (): number[] =>
            degrees.map((d, i) => (d % 2 === 1 ? i : -1)).filter(i => i !== -1);

        /* 3. 计算需添加的边数 */
        let oddVertices = getOddVertices();
        const k = oddVertices.length;
        const addEdgesNum = Math.floor((k - 2) / 2);

        /* 4. 添加额外边 */
        for (let i = 0; i < addEdgesNum; i++) {
            oddVertices = getOddVertices();
            this.shuffleArray(oddVertices);

            let found = false;
            for (let a = 0; a < oddVertices.length; a++) {
                for (let b = a + 1; b < oddVertices.length; b++) {
                    const u = oddVertices[a];
                    const v = oddVertices[b];
                    if (u === v || adjSet[u].has(v)) continue;

                    // 添加边
                    edges.push([u, v]);
                    adjSet[u].add(v);
                    adjSet[v].add(u);
                    degrees[u]++;
                    degrees[v]++;
                    found = true;
                    break;
                }
                if (found) break;
            }

            if (!found) return this.generateEulerianLevel(pointNumber, maxRetry - 1);
        }

        /* 5. 最终校验 */
        oddVertices = getOddVertices();
        if (oddVertices.length === 2) {
            return { edges, start: oddVertices[0], end: oddVertices[1] };
        }

        return this.generateEulerianLevel(pointNumber, maxRetry - 1);
    }
    
    private generateRandomTree(n: number): TreeResult | null {
        if (n === 0) return null;
        if (n === 1) return { edges: [], adjSet: [new Set()] };

        const adjSet: Set<number>[] = Array.from({ length: n }, () => new Set());
        const edges: Edge[] = [];
        const visited: boolean[] = new Array<boolean>(n).fill(false);
        const queue: number[] = [0];
        visited[0] = true;
        const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i).slice(1));

        while (unvisited.size > 0) {
            const u = this.sample(Array.from({ length: n }, (_, i) => i).filter(i => visited[i]));
            const v = this.sample(Array.from(unvisited));
            if (u === undefined || v === undefined) return null;
            edges.push([u, v]);
            adjSet[u].add(v);
            adjSet[v].add(u);
            visited[v] = true;
            unvisited.delete(v);
            queue.push(v);
        }

        return { edges, adjSet };
    }
    
    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    private sample<T>(arr: T[]): T | undefined {
        if (arr.length === 0) return undefined;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private handlePointerUp() {
        if (this.isDrawing) {
            // Reset the drawing state
            this.isDrawing = false;
            if (this.tempLine) {
                this.tempLine.clear();
            }

            // 检查是否成功完成游戏
            if (this.currentLevel && this.currentPath.length > 1) {
                const allEdgesUsed = this.currentLevel.edges.every(([u, v]) => {
                    const edgeKey = [u, v].sort((a, b) => a - b).join('-');
                    return this.usedEdges.has(edgeKey);
                });

                // const startCorrect = this.currentPath[0] === this.currentLevel.start;
                // const endCorrect = this.currentPath[this.currentPath.length - 1] === this.currentLevel.end;

                if (allEdgesUsed) {
                    this.showModalBox();
                }
            }
        }
    }
    
    private showModalBox(): void {
        
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        graphics.setDepth(10);
        
        const width = 600;
        const height = 400;
        const x = this.cameras.main.centerX - width / 2;
        const y = this.cameras.main.centerY - height / 2;
        
        graphics.fillStyle(0x9cbf86, 1);
        graphics.fillRoundedRect(x, y, width, height, 20);
        
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, '恭喜你，你完成了视觉绘制！', {
            fontSize: '32px',
            color: '#FFFFFF',
            align: 'center',
            fontFamily: "Arial"
        }).setOrigin(0.5).setDepth(11);
        
        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY + 20,"button-normal", "button-pressed", "确定", 11, () => {
            console.log('视觉设计完成，返回开发中心');
            const task = this.currentOrder.items.find(item => item.item.id === 'visual_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }
            this.scene.start('GameEntrance', {order: this.currentOrder});
        })
    }
}