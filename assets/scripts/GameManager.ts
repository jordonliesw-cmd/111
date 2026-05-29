import { _decorator, Component, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    enemyPrefab: Prefab = null;

    @property(Prefab)
    projectilePrefab: Prefab = null;

    private static instance: GameManager = null;

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public currentWave: number = 1;
    public score: number = 0;
    public kills: number = 0;
    public coins: number = 0;
    public upgradePoints: number = 0;
    public difficulty: 'easy' | 'normal' | 'hard' | 'insane' = 'normal';

    protected onLoad(): void {
        GameManager.instance = this;
    }

    public resetGame(): void {
        this.currentWave = 1;
        this.score = 0;
        this.kills = 0;
        this.coins = 0;
        this.upgradePoints = 0;
    }
}
