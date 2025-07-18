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
    
    private nodes: Phaser.GameObjects.Graphics[] = [];
    private edges: Phaser.GameObjects.Graphics[] = [];
    private currentLevel: EulerLevel | null = null;
    private currentPath: number[] = [];
    private isDrawing = false;
    private line: Phaser.GameObjects.Graphics | null = null;
    private tempLine: Phaser.GameObjects.Graphics | null = null;
    private pointNumber: number = 15;
    private nodePositions: { x: number, y: number }[] = [];
    private lastNodeIndex: number | null = null;
    private clearPathButton: Phaser.GameObjects.Container | null = null;
    private regenerateButton: Phaser.GameObjects.Container | null = null; // 新增按钮实例
    // 新增属性，用于指定顶点生成范围
    private vertexRange = {
        minX: 100,
        maxX: 900,
        minY: 200,
        maxY: 700
    };
    // 定义最大随机偏移量
    private maxOffset = 20;

    constructor() {
        super("VisionGame");
    };

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('VisionGame received order:', this.currentOrder);
    };

    create() {
        // Simple background for now
        this.cameras.main.setBackgroundColor('#a2a2a2');

        /* init game level */
        this.currentLevel = this.generateEulerianLevel(this.pointNumber);

        if (this.currentLevel) {
            this.drawLevel();
        }

        CommonFunction.createButton(this, 120, 90, 'button-normal', 'button-pressed', '完成视觉', 10, () => {
            console.log('视觉设计完成，返回开发中心');

            const task = this.currentOrder.items.find(item => item.item.id === 'visual_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }

            this.scene.start('GameEntrance', {order: this.currentOrder});
        });

        // 创建清除路径按钮并保存实例
        this.clearPathButton = CommonFunction.createButton(this, 120, 150, 'button-normal', 'button-pressed', '清除路径', 10, () => {
            this.resetDrawing();
        });
        this.clearPathButton.setVisible(false); // 初始时隐藏按钮

        // 创建重新生成欧拉图按钮并保存实例
        this.regenerateButton = CommonFunction.createButton(this, 120, 210, 'button-normal', 'button-pressed', '重新生成欧拉图', 10, () => {
            this.regenerateEulerianLevel();
        });
        this.regenerateButton.setVisible(true); // 初始时隐藏按钮

        // test for eulerian level
        const eulerLevel = this.generateEulerianLevel(10);
        console.log(eulerLevel);

        // 监听鼠标事件
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerup', this.handlePointerUp, this);
    };

    private drawLevel() {
        if (!this.currentLevel) return;

        const nodeRadius: number = 20;
        this.nodePositions = [];
        const numNodes = this.currentLevel.edges.reduce((max, [u, v]) => Math.max(max, u, v), 0) + 1;

        // 环形布局顶点
        const centerX = (this.vertexRange.minX + this.vertexRange.maxX) / 2;
        const centerY = (this.vertexRange.minY + this.vertexRange.maxY) / 2;
        const radius = Math.min(
            (this.vertexRange.maxX - this.vertexRange.minX) / 2 - nodeRadius * 2,
            (this.vertexRange.maxY - this.vertexRange.minY) / 2 - nodeRadius * 2
        );

        for (let i = 0; i < numNodes; i++) {
            const angle = (2 * Math.PI * i) / numNodes;
            let x = centerX + radius * Math.cos(angle);
            let y = centerY + radius * Math.sin(angle);

            // 添加随机偏移
            x += Phaser.Math.Between(-this.maxOffset, this.maxOffset);
            y += Phaser.Math.Between(-this.maxOffset, this.maxOffset);

            // 确保顶点在指定范围内
            x = Phaser.Math.Clamp(x, this.vertexRange.minX + nodeRadius, this.vertexRange.maxX - nodeRadius);
            y = Phaser.Math.Clamp(y, this.vertexRange.minY + nodeRadius, this.vertexRange.maxY - nodeRadius);

            this.nodePositions.push({x, y});
        }

        /* draw the edges */
        for (const [u, v] of this.currentLevel.edges) {
            const edge = this.add.graphics();
            edge.lineStyle(2, 0x000000);
            edge.beginPath();
            edge.moveTo(this.nodePositions[u].x, this.nodePositions[u].y);
            edge.lineTo(this.nodePositions[v].x, this.nodePositions[v].y);
            edge.strokePath();
            this.edges.push(edge);
        }

        /* draw the nodes */
        for (let i = 0; i < numNodes; i++) {
            const node = this.add.graphics();
            node.fillStyle(0x000000, 1);
            node.fillCircle(this.nodePositions[i].x, this.nodePositions[i].y, nodeRadius);
            this.nodes.push(node);
        }
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (!this.currentLevel) return;

        const nodeRadius = 20;
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
                        this.line.lineStyle(2, 0x00ff00);
                        this.line.beginPath();
                        this.line.moveTo(nodePos.x, nodePos.y);
                        this.tempLine = this.add.graphics();
                        this.tempLine.lineStyle(2, 0x00ff00, 0.5);
                        this.tempLine.beginPath();
                        this.tempLine.moveTo(nodePos.x, nodePos.y);
                    } else if (i === this.lastNodeIndex) {
                        // 从最后一个节点继续绘制
                        this.isDrawing = true;
                        this.tempLine = this.add.graphics();
                        this.tempLine.lineStyle(2, 0x00ff00, 0.5);
                        this.tempLine.beginPath();
                        this.tempLine.moveTo(nodePos.x, nodePos.y);
                    } else {
                        // 点击非最后一个节点，不做处理
                        return;
                    }
                }
                break;
            }
        }
    }

    private handlePointerUp(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing || !this.currentLevel || !this.line || !this.tempLine) return;

        const isPathCompleted = this.currentPath.length === this.currentLevel.edges.length + 1;

        if (isPathCompleted) {
            this.isDrawing = false;
            alert("success");
            if (this.clearPathButton) {
                this.clearPathButton.setVisible(true);
            }
        } else {
            // 未完成时停止绘制，但保留最后节点信息
            this.isDrawing = false;
            this.tempLine.clear();
            this.tempLine.destroy();
            this.tempLine = null;
        }
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing || !this.tempLine || !this.line) return;

        this.tempLine.clear();
        this.tempLine.lineStyle(2, 0x00ff00, 0.5);
        this.tempLine.beginPath();
        const lastPos = this.nodePositions[this.lastNodeIndex!];
        this.tempLine.moveTo(lastPos.x, lastPos.y);
        this.tempLine.lineTo(pointer.x, pointer.y);
        this.tempLine.strokePath();

        const nodeRadius = 20;
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
                    this.line.lineTo(nodePos.x, nodePos.y);
                    this.line.strokePath();
                    this.lastNodeIndex = i;
                    this.tempLine.clear();
                    this.tempLine.beginPath();
                    this.tempLine.moveTo(nodePos.x, nodePos.y);
                    this.usedEdges.add(edgeKey);

                    if (this.clearPathButton) {
                        this.clearPathButton.setVisible(true);
                    }
                }
                break;
            }
        }
    }

    // 新增属性，用于记录已走过的边
    private usedEdges: Set<string> = new Set();

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

        // 隐藏清除路径按钮
        if (this.clearPathButton) {
            this.clearPathButton.setVisible(false);
        }
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
    
}