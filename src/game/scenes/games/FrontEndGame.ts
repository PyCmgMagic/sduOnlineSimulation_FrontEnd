import { Scene } from "phaser";
import { CustomerOrder } from "../Game.ts";
import { CommonFunction } from "../../../utils/CommonFunction.ts";

// 俄罗斯方块形状定义
interface TetrominoShape {
    shape: number[][];
    color: number;
}

// 游戏状态
interface GameState {
    board: number[][];
    currentPiece: {
        shape: number[][];
        x: number;
        y: number;
        color: number;
    } | null;
    nextPiece: TetrominoShape | null;
    ghostPiece: {
        shape: number[][];
        x: number;
        y: number;
        color: number;
    } | null;
    heldPiece: TetrominoShape | null;
    canHold: boolean;
    score: number;
    level: number;
    linesCleared: number;
    gameTime: number; // 游戏时间（秒）
    isGameOver: boolean;
    isPaused: boolean;
    clearedBlocksByColor: { [color: number]: number };
}

// 游戏目标接口
interface GameTargets {
    [color: number]: number; // key是颜色，value是需要完成的目标组数（每5个方块为1组）
}

export class FrontEndGame extends Scene {
    private currentOrder: CustomerOrder;
    private gameTargets: GameTargets; // 存储游戏目标

    // 游戏配置
    private readonly BOARD_WIDTH = 10;
    private readonly BOARD_HEIGHT = 20;
    private readonly CELL_SIZE = 30;
    private readonly BOARD_OFFSET_X = 400;
    private readonly BOARD_OFFSET_Y = 100;
    private  TOTAL_TIME = 60; // 倒计时总秒数

    // 游戏状态
    private gameState: GameState;
    private dropTimer: Phaser.Time.TimerEvent | null = null;
    private gameTimer: Phaser.Time.TimerEvent | null = null;
    private dropInterval: number = 1000;
    private initialDropInterval: number = 1000;

    // UI元素
    private boardGraphics: Phaser.GameObjects.Graphics;
    private scoreText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private linesText: Phaser.GameObjects.Text;
    private timeText: Phaser.GameObjects.Text;
    private nextPieceGraphics: Phaser.GameObjects.Graphics;
    private heldPieceGraphics: Phaser.GameObjects.Graphics;
    private gameOverText: Phaser.GameObjects.Text | null = null;
    private pauseText: Phaser.GameObjects.Text | null = null;
    private colorCountTexts: Map<number, Phaser.GameObjects.Text> = new Map();
    private colorProgressBars: Map<number, Phaser.GameObjects.Graphics> = new Map();
    private restartButton: Phaser.GameObjects.Container | null = null;

    // 粒子效果
    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    private readonly TETROMINOES: { [key: string]: TetrominoShape } = {
        I: { shape: [[1, 1, 1, 1]], color: 0xFFB366 }, // 橙色 HTML
        O: { shape: [[1, 1], [1, 1]], color: 0xFFD93D }, // 黄色 CSS
        T: { shape: [[0, 1, 0], [1, 1, 1]], color: 0xFF6B9D }, // 粉色 JS
        S: { shape: [[0, 1, 1], [1, 1, 0]], color: 0x87CEEB}, // 蓝色 React
        Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 0x90EE90  }, // 绿色 Vue
        J: { shape: [[1, 0, 0], [1, 1, 1]], color: 0xFF7F7F  }, // 红色色 性能优化
        L: { shape: [[0, 0, 1], [1, 1, 1]], color: 0xDDA0DD }  // 淡紫色 页面美化
    };

    constructor() {
        super("FrontEndGame");
    }

    init(data: { order: CustomerOrder }) {
        this.currentOrder = data.order;
        this.TOTAL_TIME = (360 -this.currentOrder.difficulty * 60);
        console.log('FrontEndGame received order:', this.currentOrder);
        this.initializeTargets(this.currentOrder.difficulty); // 在这里初始化目标
    }

    create() {
        this.createWarmBackground();
        this.initializeGameState();
        this.createGameUI();
        this.updateColorCountsDisplay(); // 初始调用以显示目标
        this.createBoard();
        this.createNextPieceDisplay();
        this.createControls();
        this.createDecorations();
        CommonFunction.createBookInfoButton(this, this.cameras.main.width - 50, 50, '游戏说明', '每种颜色的方块代表一种技术，在规定时间内消除更多的方块吧!最终的分数将根据得分以及技术右侧各技术的统计数量判定噢！');
        this.createParticleEffects();
        this.spawnNewPiece();
        this.startDropTimer();
        this.startGameTimer();
        this.setupKeyboardControls();
    }

    // 根据难度初始化游戏目标 
    private initializeTargets(difficulty: number): void {
        this.gameTargets = {};
        const colors = [...new Set(Object.values(this.TETROMINOES).map(t => t.color))];

        const baseTarget = Math.max(1, Math.floor(difficulty / 2));
        let bonusTargets = difficulty;

        for (const color of colors) {
            this.gameTargets[color] = baseTarget;
        }

        for (let i = 0; i < bonusTargets; i++) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.gameTargets[randomColor]++;
        }
        console.log("Initialized Targets:", this.gameTargets);
    }

    private createWarmBackground(): void {
        const topColor = Phaser.Display.Color.ValueToColor('#FFF4E6');
        const bottomColor = Phaser.Display.Color.ValueToColor('#FFE4B5');
        const bg = this.add.graphics();
        bg.fillGradientStyle(topColor.color, topColor.color, bottomColor.color, bottomColor.color, 1);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height;
            const radius = 20 + Math.random() * 40;
            const alpha = 0.1 + Math.random() * 0.1;
            const circle = this.add.graphics();
            circle.fillStyle(0xFFB366, alpha);
            circle.fillCircle(x, y, radius);
            this.tweens.add({
                targets: circle, y: y - 20, duration: 3000 + Math.random() * 2000,
                ease: 'Sine.easeInOut', yoyo: true, repeat: -1
            });
        }
    }

    private createDecorations(): void {
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(4, 0xFF8C69, 1);
        borderGraphics.strokeRoundedRect(this.BOARD_OFFSET_X - 10, this.BOARD_OFFSET_Y - 10, this.BOARD_WIDTH * this.CELL_SIZE + 20, this.BOARD_HEIGHT * this.CELL_SIZE + 20, 8);
        const shadowGraphics = this.add.graphics();
        shadowGraphics.fillStyle(0xFFB366, 0.1);
        shadowGraphics.fillRoundedRect(this.BOARD_OFFSET_X - 5, this.BOARD_OFFSET_Y - 5, this.BOARD_WIDTH * this.CELL_SIZE + 10, this.BOARD_HEIGHT * this.CELL_SIZE + 10, 5);
    }

    private initializeGameState(): void {
        const baseInterval = 1150;
        const speedFactor = 150;
        const minInterval = 250;
        const difficulty = Math.max(1, this.currentOrder.difficulty);
        this.initialDropInterval = Math.max(minInterval, baseInterval - (difficulty * speedFactor));
        this.dropInterval = this.initialDropInterval;

        this.gameState = {
            board: Array(this.BOARD_HEIGHT).fill(null).map(() => Array(this.BOARD_WIDTH).fill(0)),
            currentPiece: null,
            nextPiece: null,
            ghostPiece: null,
            heldPiece: null,
            canHold: true,
            score: 0,
            level: 1,
            linesCleared: 0,
            gameTime: 0,
            isGameOver: false,
            isPaused: false,
            clearedBlocksByColor: {}
        };
    }

    private createGameUI(): void {
        const titleText = this.add.text(50, 50, '前端开发', {
            fontSize: '32px', color: '#8B4513', fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", cursive',
            stroke: '#FFF8DC', strokeThickness: 6
        });
        titleText.setShadow(3, 3, 'rgba(255,140,0,0.3)', 5, true, true);
        const infoBg = this.add.graphics();
        infoBg.fillStyle(0xFFF8DC, 0.8);
        infoBg.fillRoundedRect(30, 110, 300, 200, 15);
        infoBg.lineStyle(3, 0xDEB887, 1);
        infoBg.strokeRoundedRect(30, 110, 300, 200, 15);
        this.scoreText = this.add.text(50, 130, '✨ 分数: 0', { fontSize: '22px', color: '#B8860B', fontFamily: '"Comic Sans MS", cursive' });
        this.levelText = this.add.text(50, 160, '🌟 难度 等级: '+ this.currentOrder.difficulty, { fontSize: '22px', color: '#CD853F', fontFamily: '"Comic Sans MS", cursive' });
        this.linesText = this.add.text(50, 190, '🎯 消除: 0行', { fontSize: '22px', color: '#D2691E', fontFamily: '"Comic Sans MS", cursive' });
        this.timeText = this.add.text(50, 220, '⏱️ 时间: 00:00', { fontSize: '22px', color: '#8B4513', fontFamily: '"Comic Sans MS", cursive' });
        const controlsBg = this.add.graphics();
        controlsBg.fillStyle(0xFFF8DC, 0.8);
        controlsBg.fillRoundedRect(30, 330, 300, 180, 15);
        controlsBg.lineStyle(3, 0xDEB887, 1);
        controlsBg.strokeRoundedRect(30, 330, 300, 180, 15);
        this.add.text(50, 340, '🎮 操作指南', { fontSize: '20px', color: '#8B4513', fontFamily: '"Comic Sans MS", cursive' });
        const controls = ['← → 左右移动', '↓ 加速下落', '↑ 旋转方块', '空格 暂停游戏', 'C 暂存方块'];
        controls.forEach((control, index) => {
            this.add.text(50, 370 + index * 25, control, { fontSize: '16px', color: '#A0522D', fontFamily: '"Arial", sans-serif' });
        });
        this.createDisplayArea(50, 530, '🔮 下一个');
        this.createDisplayArea(200, 530, '💾 暂存');
        this.heldPieceGraphics = this.add.graphics();

        const statsAreaX = this.BOARD_OFFSET_X + this.BOARD_WIDTH * this.CELL_SIZE + 30;
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0xFFF8DC, 0.8);
        statsBg.fillRoundedRect(statsAreaX, this.BOARD_OFFSET_Y, 240, 280, 15);
        statsBg.lineStyle(3, 0xDEB887, 1);
        statsBg.strokeRoundedRect(statsAreaX, this.BOARD_OFFSET_Y, 240, 280, 15);
        this.add.text(statsAreaX + 10, this.BOARD_OFFSET_Y + 10, '📊 开发目标', { fontSize: '20px', color: '#8B4513', fontFamily: '"Comic Sans MS", cursive' });
        let yPos = this.BOARD_OFFSET_Y + 50;
        const uniqueColors = [...new Set(Object.values(this.TETROMINOES).map(t => t.color))];
        const BAR_MAX_WIDTH = 100;
        const BAR_HEIGHT = 18;

        uniqueColors.forEach(color => {
            const barBg = this.add.graphics();
            barBg.fillStyle(0x000000, 0.2);
            barBg.fillRoundedRect(statsAreaX + 20, yPos, BAR_MAX_WIDTH, BAR_HEIGHT, 5);
            const barFill = this.add.graphics();
            this.colorProgressBars.set(color, barFill);
            const text = this.add.text(statsAreaX + 20 + BAR_MAX_WIDTH + 10, yPos, '', { fontSize: '16px', color: '#A0522D', fontFamily: '"Arial", sans-serif' });
            this.colorCountTexts.set(color, text);
            yPos += 30;
        });
    }

    private getTextToShow(color: number): string {
        switch(color) {
            case 0xFFB366: return 'HTML';
            case 0xFFD93D: return 'CSS';
            case 0xFF6B9D: return 'JS';
            case 0x90EE90: return 'Vue';
            case 0xFF7F7F: return '性能优化';
            case 0x87CEEB: return 'React';
            case 0xDDA0DD: return '页面美化';
            default: return '增强';
        }
    }

    private createDisplayArea(x: number, y: number, title: string): void {
        const bg = this.add.graphics();
        bg.fillStyle(0xFFF8DC, 0.9);
        bg.fillRoundedRect(x - 10, y - 10, 120, 100, 10);
        bg.lineStyle(2, 0xF4A460, 1);
        bg.strokeRoundedRect(x - 10, y - 10, 120, 100, 10);
        this.add.text(x, y, title, { fontSize: '18px', color: '#8B4513', fontFamily: '"Comic Sans MS", cursive' });
    }

    private createBoard(): void {
        const boardBg = this.add.graphics();
        boardBg.fillStyle(0xFFFAF0, 0.9);
        boardBg.fillRect(this.BOARD_OFFSET_X, this.BOARD_OFFSET_Y, this.BOARD_WIDTH * this.CELL_SIZE, this.BOARD_HEIGHT * this.CELL_SIZE);
        this.boardGraphics = this.add.graphics();
        this.drawBoard();
    }

    private drawBoard(): void {
        this.boardGraphics.clear();
        this.boardGraphics.lineStyle(1, 0xF5DEB3, 0.4);
        for (let i = 1; i < this.BOARD_WIDTH; i++) {
            this.boardGraphics.lineBetween(this.BOARD_OFFSET_X + i * this.CELL_SIZE, this.BOARD_OFFSET_Y, this.BOARD_OFFSET_X + i * this.CELL_SIZE, this.BOARD_OFFSET_Y + this.BOARD_HEIGHT * this.CELL_SIZE);
        }
        for (let i = 1; i < this.BOARD_HEIGHT; i++) {
            this.boardGraphics.lineBetween(this.BOARD_OFFSET_X, this.BOARD_OFFSET_Y + i * this.CELL_SIZE, this.BOARD_OFFSET_X + this.BOARD_WIDTH * this.CELL_SIZE, this.BOARD_OFFSET_Y + i * this.CELL_SIZE);
        }
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.gameState.board[y][x] !== 0) {
                    this.drawCell(this.boardGraphics, x, y, this.gameState.board[y][x]);
                }
            }
        }
        if (this.gameState.currentPiece) {
            this.drawCurrentPiece();
        }
    }

    private drawCell(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
        const pixelX = this.BOARD_OFFSET_X + x * this.CELL_SIZE;
        const pixelY = this.BOARD_OFFSET_Y + y * this.CELL_SIZE;
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(pixelX + 2, pixelY + 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 4);
        graphics.fillStyle(0xFFFFFF, 0.4);
        graphics.fillRoundedRect(pixelX + 3, pixelY + 3, this.CELL_SIZE - 6, 6, 2);
        graphics.lineStyle(1, this.darkenColor(color, 0.3), 0.8);
        graphics.strokeRoundedRect(pixelX + 2, pixelY + 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 4);
    }

    private darkenColor(color: number, factor: number): number {
        const r = Math.floor(((color >> 16) & 0xFF) * (1 - factor));
        const g = Math.floor(((color >> 8) & 0xFF) * (1 - factor));
        const b = Math.floor((color & 0xFF) * (1 - factor));
        return (r << 16) | (g << 8) | b;
    }

    private drawCurrentPiece(): void {
        if (!this.gameState.currentPiece) return;
        this.updateGhostPiece();
        this.drawGhostPiece();
        const { shape, x, y, color } = this.gameState.currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawCell(this.boardGraphics, x + col, y + row, color);
                }
            }
        }
    }

    private updateGhostPiece(): void {
        if (!this.gameState.currentPiece) return;
        this.gameState.ghostPiece = { ...this.gameState.currentPiece, y: this.gameState.currentPiece.y };
        while (this.isValidPosition(this.gameState.ghostPiece)) {
            this.gameState.ghostPiece.y++;
        }
        this.gameState.ghostPiece.y--;
    }

    private drawGhostPiece(): void {
        if (!this.gameState.ghostPiece || (this.gameState.currentPiece && this.gameState.ghostPiece.y === this.gameState.currentPiece.y)) return;
        const { shape, x, y, color } = this.gameState.ghostPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const pixelX = this.BOARD_OFFSET_X + (x + col) * this.CELL_SIZE;
                    const pixelY = this.BOARD_OFFSET_Y + (y + row) * this.CELL_SIZE;
                    this.boardGraphics.fillStyle(color, 0.2);
                    this.boardGraphics.fillRoundedRect(pixelX + 3, pixelY + 3, this.CELL_SIZE - 6, this.CELL_SIZE - 6, 3);
                    this.boardGraphics.lineStyle(2, color, 0.5);
                    this.boardGraphics.strokeRoundedRect(pixelX + 3, pixelY + 3, this.CELL_SIZE - 6, this.CELL_SIZE - 6, 3);
                }
            }
        }
    }

    private createNextPieceDisplay(): void {
        this.nextPieceGraphics = this.add.graphics();
    }

    private drawNextPiece(): void {
        this.nextPieceGraphics.clear();
        if (this.gameState.nextPiece) {
            this.drawDisplayPiece(this.nextPieceGraphics, this.gameState.nextPiece, 40, 540, 120, 100);
        }
    }

    private createControls(): void {
        this.restartButton = CommonFunction.createButton(this, this.cameras.main.width - 150, this.cameras.main.height - 100, 'button-normal', 'button-pressed', '🔄 重新开始', 10, () => this.restartGame(), true, 0.8);
    }

    private setupKeyboardControls(): void {
        if (!this.input.keyboard) return;
        this.input.keyboard.on('keydown-LEFT', () => this.movePiece(-1, 0));
        this.input.keyboard.on('keydown-RIGHT', () => this.movePiece(1, 0));
        this.input.keyboard.on('keydown-DOWN', () => {
            this.movePiece(0, 1);
            this.updateScore(1);
        });
        this.input.keyboard.on('keydown-UP', () => this.rotatePiece());
        this.input.keyboard.on('keydown-SPACE', () => this.togglePause());
        this.input.keyboard.on('keydown-C', () => this.holdPiece());
    }

    private holdPiece(): void {
        if (this.gameState.isGameOver || this.gameState.isPaused || !this.gameState.canHold || !this.gameState.currentPiece) return;
        this.gameState.canHold = false;
        const currentShape = { shape: this.gameState.currentPiece.shape, color: this.gameState.currentPiece.color };
        if (this.gameState.heldPiece) {
            const held = this.gameState.heldPiece;
            this.gameState.heldPiece = currentShape;
            this.spawnSpecificPiece(held);
        } else {
            this.gameState.heldPiece = currentShape;
            this.spawnNewPiece();
        }
        this.drawHeldPiece();
        this.drawBoard();
    }

    private drawHeldPiece(): void {
        this.heldPieceGraphics.clear();
        if (this.gameState.heldPiece) {
            this.drawDisplayPiece(this.heldPieceGraphics, this.gameState.heldPiece, 190, 540, 120, 100);
        }
    }

    private drawDisplayPiece(graphics: Phaser.GameObjects.Graphics, piece: TetrominoShape, containerX: number, containerY: number, containerWidth: number, containerHeight: number) {
        const { shape, color } = piece;
        const cellSize = 18;
        const totalWidth = shape[0].length * cellSize;
        const totalHeight = shape.length * cellSize;
        const centeringX = (containerWidth - totalWidth) / 2;
        const centeringY = (containerHeight - totalHeight) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const drawX = containerX + centeringX + col * cellSize;
                    const drawY = containerY + centeringY + row * cellSize;
                    graphics.fillStyle(color, 1);
                    graphics.fillRoundedRect(drawX, drawY, cellSize - 2, cellSize - 2, 3);
                    graphics.fillStyle(0xFFFFFF, 0.4);
                    graphics.fillRoundedRect(drawX + 1, drawY + 1, cellSize - 4, 3, 1);
                }
            }
        }
    }

    private spawnNewPiece(): void {
        const pieces = Object.keys(this.TETROMINOES);
        const randomPieceKey = pieces[Math.floor(Math.random() * pieces.length)];
        const nextTetromino = this.TETROMINOES[randomPieceKey];
        const pieceToSpawn = this.gameState.nextPiece || nextTetromino;
        this.spawnSpecificPiece(pieceToSpawn);
        this.gameState.nextPiece = nextTetromino;
        this.drawNextPiece();
    }

    private spawnSpecificPiece(piece: TetrominoShape) {
        this.gameState.currentPiece = {
            shape: piece.shape,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0,
            color: piece.color
        };
        this.gameState.canHold = true;
        if (!this.isValidPosition(this.gameState.currentPiece)) {
            this.gameOver();
        }
    }

    private movePiece(dx: number, dy: number): void {
        if (this.gameState.isGameOver || this.gameState.isPaused || !this.gameState.currentPiece) return;
        const newPiece = { ...this.gameState.currentPiece, x: this.gameState.currentPiece.x + dx, y: this.gameState.currentPiece.y + dy };
        if (this.isValidPosition(newPiece)) {
            this.gameState.currentPiece = newPiece;
            this.drawBoard();
        } else if (dy > 0) {
            this.placePiece();
        }
    }

    private rotatePiece(): void {
        if (this.gameState.isGameOver || this.gameState.isPaused || !this.gameState.currentPiece) return;
        const newPiece = { ...this.gameState.currentPiece, shape: this.rotateMatrix(this.gameState.currentPiece.shape) };
        if (this.isValidPosition(newPiece)) {
            this.gameState.currentPiece = newPiece;
            this.drawBoard();
            this.createRotateEffect();
        }
    }

    private createRotateEffect(): void {
        if (!this.gameState.currentPiece) return;
        const centerX = this.BOARD_OFFSET_X + (this.gameState.currentPiece.x + this.gameState.currentPiece.shape[0].length / 2) * this.CELL_SIZE;
        const centerY = this.BOARD_OFFSET_Y + (this.gameState.currentPiece.y + this.gameState.currentPiece.shape.length / 2) * this.CELL_SIZE;
        for (let i = 0; i < 6; i++) {
            const particle = this.add.graphics();
            particle.fillStyle(0xFFD700, 0.8);
            particle.fillCircle(0, 0, 3);
            particle.x = centerX;
            particle.y = centerY;
            const angle = (Math.PI * 2 / 6) * i;
            const distance = 30;
            this.tweens.add({
                targets: particle,
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                alpha: 0, duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    private rotateMatrix(matrix: number[][]): number[][] {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        return rotated;
    }

    private isValidPosition(piece: any): boolean {
        const { shape, x, y } = piece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    if (newX < 0 || newX >= this.BOARD_WIDTH || newY >= this.BOARD_HEIGHT) return false;
                    if (newY >= 0 && this.gameState.board[newY][newX] !== 0) return false;
                }
            }
        }
        return true;
    }

    private placePiece(): void {
        if (!this.gameState.currentPiece) return;
        const { shape, x, y, color } = this.gameState.currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    if (boardY >= 0) {
                        this.gameState.board[boardY][boardX] = color;
                    }
                }
            }
        }
        this.gameState.currentPiece = null;
        this.clearLines();
        if (!this.gameState.isGameOver) {
            this.spawnNewPiece();
        }
        this.drawBoard();
    }

    private clearLines(): void {
        let linesClearedInTurn = 0;
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.gameState.board[y].every(cell => cell !== 0)) {
                for (const color of this.gameState.board[y]) {
                    if (color !== 0) {
                        this.gameState.clearedBlocksByColor[color] = (this.gameState.clearedBlocksByColor[color] || 0) + 1;
                    }
                }
                linesClearedInTurn++;
                this.createLineClearEffect(y);
                this.gameState.board.splice(y, 1);
                this.gameState.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                y++;
            }
        }
        if (linesClearedInTurn > 0) {
            const scoreValues = [0, 100, 300, 500, 800];
            this.updateScore(scoreValues[linesClearedInTurn] * this.gameState.level);
            this.gameState.linesCleared += linesClearedInTurn;
            this.updateLevel();
            this.updateColorCountsDisplay(); //在消除后更新统计并检查胜利条件
        }
    }

    private createLineClearEffect(row: number): void {
        if (this.particleEmitter) {
            this.particleEmitter.explode(30, this.BOARD_OFFSET_X + (this.BOARD_WIDTH * this.CELL_SIZE) / 2, this.BOARD_OFFSET_Y + row * this.CELL_SIZE + this.CELL_SIZE / 2);
        }
    }

    private createParticleEffects(): void { }

    private updateScore(points: number): void {
        this.gameState.score += points;
        this.scoreText.setText(`✨ 分数: ${this.gameState.score}`);
    }

    private updateLevel(): void {
        this.linesText.setText(`🎯 消除: ${this.gameState.linesCleared}行`);
        const newLevel = Math.floor(this.gameState.linesCleared / 10) + 1;
        if (newLevel > this.gameState.level) {
            this.gameState.level = newLevel;
            this.dropInterval = Math.max(200, this.initialDropInterval - (this.gameState.level - 1) * 50);
            this.startDropTimer();
        }
    }

    private updateColorCountsDisplay(): void {
        const BAR_MAX_WIDTH = 100;
        const BAR_HEIGHT = 18;
        const statsAreaX = this.BOARD_OFFSET_X + this.BOARD_WIDTH * this.CELL_SIZE + 30;
        const barStartX = statsAreaX + 20;

        for (const [color, barFill] of this.colorProgressBars.entries()) {
            const count = this.gameState.clearedBlocksByColor[color] || 0;
            const textObject = this.colorCountTexts.get(color);
            const targetSets = this.gameTargets[color] || 0;

            if (!textObject || !barFill) continue;

            const completedSets = Math.floor(count / 5);
            let progressInSet = count % 5;
            if (count > 0 && completedSets < targetSets && progressInSet === 0) {
                 progressInSet = 5;
            } else if (completedSets >= targetSets) {
                 progressInSet = 5;
            }

            const fillWidth = (progressInSet / 5) * BAR_MAX_WIDTH;
            barFill.clear();
            if (fillWidth > 0) {
                barFill.fillStyle(color, 1);
                barFill.fillRoundedRect(barStartX, textObject.y, fillWidth, BAR_HEIGHT, 5);
            }

            textObject.setText(`${this.getTextToShow(color)}: ${completedSets} / ${targetSets}`);
            if (completedSets >= targetSets) {
                textObject.setColor('#32CD32'); 
            } else {
                textObject.setColor('#A0522D'); 
            }
        }
        if (!this.gameState.isGameOver && this.checkWinCondition()) {
            this.winGame();
        }
    }

    private startDropTimer(): void {
        if (this.dropTimer) {
            this.dropTimer.remove(false);
        }
        this.dropTimer = this.time.addEvent({
            delay: this.dropInterval,
            callback: () => this.movePiece(0, 1),
            callbackScope: this,
            loop: true
        });
    }

    private togglePause(): void {
        if (this.gameState.isGameOver) return;
        this.gameState.isPaused = !this.gameState.isPaused;
        if (this.gameState.isPaused) {
            if (this.dropTimer) this.dropTimer.paused = true;
            if (this.gameTimer) this.gameTimer.paused = true;
            this.pauseText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '⏸️ 已暂停', {
                fontSize: '48px', color: '#8B4513', backgroundColor: 'rgba(255, 248, 220, 0.8)', padding: { x: 20, y: 10 },
                fontFamily: '"Comic Sans MS", cursive'
            }).setOrigin(0.5);
        } else {
            if (this.dropTimer) this.dropTimer.paused = false;
            if (this.gameTimer) this.gameTimer.paused = false;
            this.pauseText?.destroy();
            this.pauseText = null;
        }
    }

    private checkWinCondition(): boolean {
        if (!this.gameTargets) return false;
        for (const colorStr in this.gameTargets) {
            const color = parseInt(colorStr, 10);
            const targetSets = this.gameTargets[color];
            const currentCount = this.gameState.clearedBlocksByColor[color] || 0;
            const currentSets = Math.floor(currentCount / 5);
            if (currentSets < targetSets) {
                return false;
            }
        }
        return true;
    }

    private winGame(): void {
        if (this.gameState.isGameOver) return;
        this.showGameResults("游戏结束！");
    }

    private gameOver(): void {
        if (this.gameState.isGameOver) return;
        if (this.checkWinCondition()) {
            this.winGame(); 
            return;
        }
        this.showGameResults("游戏结束！");
    }

    private calculateCompletionRate(): { rate: number, progress: Map<number, { current: number, target: number }> } {
        let totalTargetSets = 0;
        let totalCompletedSets = 0;
        const progress = new Map<number, { current: number, target: number }>();

        for (const colorStr in this.gameTargets) {
            const color = parseInt(colorStr, 10);
            const targetSets = this.gameTargets[color];
            const currentCount = this.gameState.clearedBlocksByColor[color] || 0;
            const currentSets = Math.floor(currentCount / 5);

            totalTargetSets += targetSets;
            totalCompletedSets += Math.min(currentSets, targetSets);
            progress.set(color, { current: currentSets, target: targetSets });
        }

        if (totalTargetSets === 0) {
            return { rate: 1, progress }; 
        }

        return { rate: totalCompletedSets / totalTargetSets, progress };
    }
    private calculateScoreRate(): number {
        const baseScore = this.gameState.score;
        const { rate: completionRate } = this.calculateCompletionRate();
        const scoreRate = completionRate + baseScore / 20000;
        return Math.round(scoreRate * 100) / 100;
    }
    private showGameResults(title: string): void {
        if (this.gameState.isGameOver) return;

        this.gameState.isGameOver = true;
        this.dropTimer?.remove(false);
        this.gameTimer?.remove(false);
        this.input.keyboard?.removeAllListeners();
        this.restartButton?.destroy(); // 移除重新开始按钮

        const { rate: completionRate, progress } = this.calculateCompletionRate();
        const finalScore = this.gameState.score
        const scoreRate = this.calculateScoreRate();
        console.log("最终分数比率：", scoreRate);
        const overlay = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, this.cameras.main.height), Phaser.Geom.Rectangle.Contains);

        const panelWidth = 500;
        const panelHeight = 450;
        const panelX = (this.cameras.main.width - panelWidth) / 2;
        const panelY = (this.cameras.main.height - panelHeight) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0xFFF8DC, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panel.lineStyle(4, 0xDEB887, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        this.add.text(panelX + panelWidth / 2, panelY + 40, title, {
            fontSize: '32px', color: '#8B4513', fontFamily: '"Comic Sans MS", cursive', stroke: '#FFF', strokeThickness: 2
        }).setOrigin(0.5);

        let yPos = panelY + 80;
        this.add.text(panelX + 50, yPos, `最终分数: ${finalScore}`, { fontSize: '24px', color: '#B8860B', fontFamily: '"Comic Sans MS", cursive' });
        yPos += 40;
        this.add.text(panelX + 50, yPos, `目标完成率: ${(completionRate * 100).toFixed(0)}%`, { fontSize: '24px', color: '#CD853F', fontFamily: '"Comic Sans MS", cursive' });
        yPos += 50;

        this.add.text(panelX + 50, yPos, '技术完成详情:', { fontSize: '20px', color: '#8B4513', fontFamily: '"Comic Sans MS", cursive' });
        yPos += 30;

        progress.forEach((data, color) => {
            const techName = this.getTextToShow(color);
            const progressText = `${techName}: ${data.current} / ${data.target} 组`;
            const textObj = this.add.text(panelX + 70, yPos, progressText, { fontSize: '18px', color: '#A0522D', fontFamily: '"Arial", sans-serif' });
            if (data.current >= data.target) {
                textObj.setColor('#32CD32'); 
            }
            yPos += 25;
        });

        CommonFunction.createButton(this, panelX + panelWidth / 2, panelY + panelHeight -30 , 'button-normal', 'button-pressed', '确认返回', 10, () => {
             const task = this.currentOrder.items.find(item => item.item.id === 'frontend_dev');
             if (task) {
                 task.status = 'completed';
                 console.log(`任务 ${task.item.name} 已标记为完成。分数: ${finalScore}, 完成率: ${(completionRate * 100).toFixed(0)}%`);
             } else {
                console.log("错误：无法在订单中找到 'frontend_dev' 任务。");
             }
             this.scene.start('GameEntrance', { order: this.currentOrder });
        }, true, 1.0)
    }

    private restartGame(): void {
        this.gameOverText?.destroy();
        this.pauseText?.destroy();

        if (this.dropTimer) {
            this.dropTimer.remove(false);
            this.dropTimer = null;
        }
        if (this.gameTimer) {
            this.gameTimer.remove(false);
            this.gameTimer = null;
        }
        this.scene.restart({ order: this.currentOrder });
    }

    private startGameTimer(): void {
        if (this.gameTimer) {
            this.gameTimer.remove(false);
        }
        this.gameState.gameTime = this.TOTAL_TIME;
        this.updateTimeDisplay();
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => this.updateGameTime(),
            callbackScope: this,
            loop: true
        });
    }

    private updateGameTime(): void {
        if (this.gameState.isGameOver || this.gameState.isPaused) return;
        if (this.gameState.gameTime > 0) {
            this.gameState.gameTime--;
            this.updateTimeDisplay();
            if (this.gameState.gameTime === 0) {
                this.gameOver();
            }
        }
    }

    private updateTimeDisplay(): void {
        this.timeText.setText(`⏱️ 剩余: ${this.formatTime(this.gameState.gameTime)}`);
    }

    private formatTime(seconds: number): string {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
}