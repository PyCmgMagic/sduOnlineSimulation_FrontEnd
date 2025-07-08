import Phaser from 'phaser'

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }
  preload() {
    // 可以在这里加载资源
  }
  create() {
    this.add.text(100, 100, 'Hello Phaser!', { font: '32px Arial', color: '#ffffff' })
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#242424',
  scene: MainScene,
  parent: undefined, // 稍后由 React 传入
}

export function createPhaserGame(parent: string | HTMLElement) {
  return new Phaser.Game({ ...config, parent })
} 