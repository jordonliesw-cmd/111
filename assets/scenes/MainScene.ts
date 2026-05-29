import { _decorator, Component, Node, Canvas, Graphics, EventTouch, Vec2, CCInteger, Label, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MainScene')
export class MainScene extends Component {
    @property(Canvas)
    canvas: Canvas = null;

    @property(Graphics)
    graphics: Graphics = null;

    @property(Node)
    uiRoot: Node = null;

    private gameRunning = false;
    private gameState: 'menu' | 'playing' | 'gameOver' | 'upgrade' = 'menu';
    private player: Player = null;
    private enemies: Enemy[] = [];
    private projectiles: Projectile[] = [];
    private particles: Particle[] = [];
    private drops: Drop[] = [];

    private currentWave = 1;
    private score = 0;
    private kills = 0;
    private coins = 0;
    private upgradePoints = 0;
    private difficulty: 'easy' | 'normal' | 'hard' | 'insane' = 'normal';
    private isBossWave = false;
    private waveStartTime = 0;
    private frameCount = 0;

    protected onLoad(): void {
        // 初始化游戏
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    protected start(): void {
        this.showMainMenu();
    }

    protected update(deltaTime: number): void {
        if (!this.gameRunning) return;

        this.frameCount++;

        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime);
        }

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(deltaTime, this.player);
            if (this.enemies[i].health <= 0) {
                this.onEnemyKilled(this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }

        // 更新投射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime);
            if (this.projectiles[i].isOffScreen(this.node.getComponent(Canvas).designResolution)) {
                this.projectiles.splice(i, 1);
            }
        }

        // 检查碰撞
        this.checkCollisions();

        // 更新掉落物品
        for (let i = this.drops.length - 1; i >= 0; i--) {
            this.drops[i].update(deltaTime);
            if (this.drops[i].isCollectingWithPlayer(this.player)) {
                this.onDropCollected(this.drops[i]);
                this.drops.splice(i, 1);
            }
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }

        // 管理波次
        if (this.enemies.length === 0 && this.frameCount % 30 === 0 && this.gameRunning) {
            this.completeWave();
        }

        // 绘制
        this.render();
    }

    private onTouchStart(event: EventTouch): void {
        if (this.gameState !== 'playing') return;
        const touchPos = event.getUILocation();
        this.player.moveTo(new Vec2(touchPos.x, touchPos.y));
    }

    private onTouchMove(event: EventTouch): void {
        if (this.gameState !== 'playing') return;
        const touchPos = event.getUILocation();
        this.player.moveTo(new Vec2(touchPos.x, touchPos.y));
    }

    private showMainMenu(): void {
        this.gameState = 'menu';
        this.graphics.clear();
        // 绘制菜单
        this.graphics.fillColor.fromHEX('#ff6b00');
        this.graphics.fillRect(0, 0, 100, 50);
    }

    private startGame(difficulty: 'easy' | 'normal' | 'hard' | 'insane'): void {
        this.difficulty = difficulty;
        this.gameState = 'playing';
        this.gameRunning = true;
        this.currentWave = 1;
        this.score = 0;
        this.kills = 0;
        this.coins = 0;
        this.upgradePoints = 0;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.drops = [];
        this.frameCount = 0;
        this.waveStartTime = Date.now();

        // 创建玩家
        this.player = new Player(new Vec2(360, 640), this);

        // 生成第一波敌人
        this.spawnWave();
    }

    private spawnWave(): void {
        const isBossWave = this.currentWave % 5 === 0;
        this.isBossWave = isBossWave;

        if (isBossWave) {
            const diffMult = { 'easy': 0.7, 'normal': 1, 'hard': 1.3, 'insane': 1.8 }[this.difficulty];
            this.enemies.push(new Boss(new Vec2(360, 200), this, diffMult));
        } else {
            const count = 3 + Math.floor(this.currentWave / 2);
            const diffMult = { 'easy': 0.8, 'normal': 1, 'hard': 1.2, 'insane': 1.5 }[this.difficulty];
            const types = ['goblin', 'orc', 'skeleton', 'demon'];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const x = 360 + Math.cos(angle) * 200;
                const y = 400 + Math.sin(angle) * 200;
                const type = types[Math.floor(Math.random() * types.length)];
                this.enemies.push(new Enemy(new Vec2(x, y), this, type as any, diffMult));
            }
        }
    }

    private completeWave(): void {
        this.currentWave++;
        this.gameState = 'upgrade';
        this.gameRunning = false;
        // 显示升级菜单
        this.showUpgradeMenu();
    }

    private checkCollisions(): void {
        // 投射物和敌人
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.projectiles[i].collidesWith(this.enemies[j])) {
                    this.enemies[j].takeDamage(this.projectiles[i].damage);
                    this.createParticles(this.enemies[j].position);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // 敌人和玩家
        for (const enemy of this.enemies) {
            if (Vec2.distance(this.player.position, enemy.position) < 30) {
                this.player.takeDamage(5);
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    private onEnemyKilled(enemy: Enemy): void {
        this.score += 100;
        this.kills++;
        this.upgradePoints++;
        this.createParticles(enemy.position);
        this.createDrops(enemy.position);
    }

    private onDropCollected(drop: Drop): void {
        if (drop.type === 'health') {
            this.player.heal(20);
        } else if (drop.type === 'coin') {
            this.coins += 10;
        }
    }

    private createParticles(pos: Vec2): void {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const vx = Math.cos(angle) * 3;
            const vy = Math.sin(angle) * 3;
            this.particles.push(new Particle(new Vec2(pos.x, pos.y), new Vec2(vx, vy)));
        }
    }

    private createDrops(pos: Vec2): void {
        if (Math.random() > 0.7) {
            const type = Math.random() > 0.5 ? 'health' : 'coin';
            this.drops.push(new Drop(new Vec2(pos.x, pos.y), type));
        }
    }

    private showUpgradeMenu(): void {
        // 升级菜单UI
    }

    private gameOver(): void {
        this.gameRunning = false;
        this.gameState = 'gameOver';
        // 显示游戏结束界面
    }

    private render(): void {
        this.graphics.clear();

        // 绘制背景
        this.graphics.fillColor.fromHEX('#1a1a1a');
        this.graphics.fillRect(0, 0, 720, 1280);

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(this.graphics);
        }

        // 绘制投射物
        for (const projectile of this.projectiles) {
            projectile.draw(this.graphics);
        }

        // 绘制掉落物
        for (const drop of this.drops) {
            drop.draw(this.graphics);
        }

        // 绘制粒子
        for (const particle of this.particles) {
            particle.draw(this.graphics);
        }

        // 绘制玩家
        if (this.player) {
            this.player.draw(this.graphics);
        }
    }

    public addProjectile(projectile: Projectile): void {
        this.projectiles.push(projectile);
    }
}

// ============ Player Class ============
class Player {
    position: Vec2;
    health: number = 100;
    maxHealth: number = 100;
    damage: number = 10;
    fireRate: number = 500;
    attackRange: number = 150;
    speed: number = 5;
    weaponType: number = 0;

    private targetPosition: Vec2;
    private lastShootTime: number = 0;
    private scene: MainScene;

    constructor(pos: Vec2, scene: MainScene) {
        this.position = pos.clone();
        this.targetPosition = pos.clone();
        this.scene = scene;
    }

    moveTo(pos: Vec2): void {
        this.targetPosition = pos.clone();
    }

    update(deltaTime: number): void {
        // 向目标位置移动
        const direction = Vec2.subtract(new Vec2(), this.targetPosition, this.position);
        if (direction.length() > this.speed) {
            direction.normalize();
            Vec2.scaleAndAdd(this.position, this.position, direction, this.speed);
        }

        // 边界检查
        this.position.x = Math.max(15, Math.min(705, this.position.x));
        this.position.y = Math.max(15, Math.min(1265, this.position.y));

        // 自动射击
        this.autoShoot();
    }

    private autoShoot(): void {
        const now = Date.now();
        if (now - this.lastShootTime > this.fireRate) {
            this.lastShootTime = now;
            // 射击逻辑
        }
    }

    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
    }

    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(graphics: Graphics): void {
        // 绘制玩家角色
        graphics.fillColor.fromHEX('#ff6b00');
        graphics.fillRect(this.position.x - 15, this.position.y - 20, 30, 40);

        // 绘制头
        graphics.fillColor.fromHEX('#ffcc99');
        graphics.circle(this.position.x, this.position.y - 25, 10);
        graphics.fill();

        // 绘制眼睛
        graphics.fillColor.fromHEX('#000000');
        graphics.circle(this.position.x - 4, this.position.y - 27, 2);
        graphics.fill();
        graphics.circle(this.position.x + 4, this.position.y - 27, 2);
        graphics.fill();
    }
}

// ============ Enemy Class ============
class Enemy {
    position: Vec2;
    health: number;
    maxHealth: number;
    speed: number;
    type: string;
    color: string;
    width: number = 24;
    height: number = 24;

    private diffMult: number;
    private scene: MainScene;

    constructor(pos: Vec2, scene: MainScene, type: string, diffMult: number) {
        this.position = pos.clone();
        this.scene = scene;
        this.type = type;
        this.diffMult = diffMult;

        const stats: any = {
            'goblin': { health: 20, speed: 2, color: '#00cc00' },
            'orc': { health: 30, speed: 1.8, color: '#cc00ff' },
            'skeleton': { health: 25, speed: 2.2, color: '#cccccc' },
            'demon': { health: 40, speed: 2.5, color: '#ff3300' }
        };

        const stat = stats[type];
        this.health = stat.health * diffMult;
        this.maxHealth = this.health;
        this.speed = stat.speed * (0.8 + diffMult * 0.4);
        this.color = stat.color;
    }

    update(deltaTime: number, player: Player): void {
        const direction = Vec2.subtract(new Vec2(), player.position, this.position);
        if (direction.length() > 0) {
            direction.normalize();
            Vec2.scaleAndAdd(this.position, this.position, direction, this.speed * deltaTime * 60);
        }
    }

    takeDamage(amount: number): void {
        this.health -= amount;
    }

    draw(graphics: Graphics): void {
        // 绘制敌人
        graphics.fillColor.fromHEX(this.color);
        graphics.fillRect(this.position.x - 12, this.position.y - 12, 24, 24);

        // 绘制血条
        const healthPercent = this.health / this.maxHealth;
        graphics.fillColor.fromHEX('#ff0000');
        graphics.fillRect(this.position.x - 12, this.position.y - 18, 24 * healthPercent, 2);
    }
}

// ============ Boss Class ============
class Boss extends Enemy {
    constructor(pos: Vec2, scene: MainScene, diffMult: number) {
        super(pos, scene, 'demon', diffMult);
        this.health = 150 * diffMult;
        this.maxHealth = this.health;
        this.width = 50;
        this.height = 50;
        this.speed = 1.2;
    }
}

// ============ Projectile Class ============
class Projectile {
    position: Vec2;
    velocity: Vec2;
    damage: number;
    radius: number = 4;
    type: string;

    constructor(pos: Vec2, vel: Vec2, damage: number, type: string) {
        this.position = pos.clone();
        this.velocity = vel.clone();
        this.damage = damage;
        this.type = type;
    }

    update(deltaTime: number): void {
        Vec2.scaleAndAdd(this.position, this.position, this.velocity, deltaTime * 60);
    }

    collidesWith(enemy: Enemy): boolean {
        return Vec2.distance(this.position, enemy.position) < this.radius + 12;
    }

    isOffScreen(designResolution: any): boolean {
        return this.position.x < -10 || this.position.x > designResolution.width + 10 ||
               this.position.y < -10 || this.position.y > designResolution.height + 10;
    }

    draw(graphics: Graphics): void {
        graphics.fillColor.fromHEX('#ffff00');
        graphics.circle(this.position.x, this.position.y, this.radius);
        graphics.fill();
    }
}

// ============ Drop Class ============
class Drop {
    position: Vec2;
    velocity: Vec2;
    type: string;

    constructor(pos: Vec2, type: string) {
        this.position = pos.clone();
        this.type = type;
        this.velocity = new Vec2((Math.random() - 0.5) * 2, -2);
    }

    update(deltaTime: number): void {
        Vec2.scaleAndAdd(this.position, this.position, this.velocity, deltaTime * 60);
        this.velocity.y += 0.1 * deltaTime * 60;
    }

    isCollectingWithPlayer(player: Player): boolean {
        return Vec2.distance(this.position, player.position) < 40;
    }

    draw(graphics: Graphics): void {
        if (this.type === 'health') {
            graphics.fillColor.fromHEX('#00ff00');
        } else {
            graphics.fillColor.fromHEX('#ffff00');
        }
        graphics.circle(this.position.x, this.position.y, 8);
        graphics.fill();
    }
}

// ============ Particle Class ============
class Particle {
    position: Vec2;
    velocity: Vec2;
    life: number = 30;
    maxLife: number = 30;

    constructor(pos: Vec2, vel: Vec2) {
        this.position = pos.clone();
        this.velocity = vel.clone();
    }

    update(deltaTime: number): void {
        Vec2.scaleAndAdd(this.position, this.position, this.velocity, deltaTime * 60);
        this.velocity.y += 0.1 * deltaTime * 60;
        this.life--;
    }

    isDead(): boolean {
        return this.life <= 0;
    }

    draw(graphics: Graphics): void {
        const opacity = this.life / this.maxLife;
        graphics.fillColor.fromHEX('#ffc800');
        graphics.circle(this.position.x, this.position.y, 3);
        graphics.fill();
    }
}
