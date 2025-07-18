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
    
    constructor() 
    {
        super("VisionGame");
    };

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        console.log('VisionGame received order:', this.currentOrder);
    };
    
    create()
    {
        // Simple background for now
        this.cameras.main.setBackgroundColor('#a2a2a2');

        CommonFunction.createButton(this, this.cameras.main.centerX, this.cameras.main.centerY, 'button-normal', 'button-pressed', '完成视觉', 10, () => {
            console.log('视觉设计完成，返回开发中心');

            const task = this.currentOrder.items.find(item => item.item.id === 'visual_design');
            if (task) {
                task.status = 'completed';
                console.log(`任务 ${task.item.name} 已标记为完成`);
            }

            this.scene.start('GameEntrance', { order: this.currentOrder });
        });
        
        // test for eulerian level
        const eulerLevel = this.generateEulerianLevel(10);
        console.log(eulerLevel);
    };

    // 欧拉路径节点树生成算法
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