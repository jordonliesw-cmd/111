Page({
  data: {
    gameState: 'menu', // menu, instructions, playing, gameOver
    playerHealth: 100,
    playerMaxHealth: 100,
    wave: 1,
    score: 0,
    kills: 0,
    upgradePoints: 0,
    showUpgrade: false,
    canvasWidth: 375,
    canvasHeight: 667
  },

  onLoad() {
    // 获取屏幕尺寸
    wx.getSystemInfo({
      success: (res) => {
        this.data.canvasWidth = res.windowWidth;
        this.data.canvasHeight = res.windowHeight;
      }
    });
  },

  startGame() {
    this.setData({ gameState: 'playing', showUpgrade: false });
    this.initGame();
  },

  showInstructions() {
    this.setData({ gameState: 'instructions' });
  },

  backToMenu() {
    this.setData({ gameState: 'menu' });
  },

  continueGame() {
    this.setData({ showUpgrade: false });
  },

  upgrade(e) {
    const type = e.currentTarget.dataset.type;
    const cost = type === 'range' ? 2 : 1;

    if (this.data.upgradePoints < cost) {
      wx.showToast({ title: '升级点数不足！', icon: 'none' });
      return;
    }

    this.data.upgradePoints -= cost;

    switch (type) {
      case 'damage':
        this.game.player.damage += 1;
        wx.showToast({ title: '攻击力 +1', icon: 'none' });
        break;
      case 'fireRate':
        this.game.player.fireRate = Math.max(200, this.game.player.fireRate - 50);
        wx.showToast({ title: '射速提升！', icon: 'none' });
        break;
      case 'health':
        this.data.playerMaxHealth += 5;
        this.data.playerHealth = this.data.playerMaxHealth;
        this.game.player.maxHealth = this.data.playerMaxHealth;
        this.game.player.health = this.data.playerMaxHealth;
        wx.showToast({ title: '生命值 +5', icon: 'none' });
        break;
      case 'range':
        this.game.player.attackRange += 50;
        wx.showToast({ title: '射程 +50px', icon: 'none' });
        break;
    }

    this.setData({ upgradePoints: this.data.upgradePoints });
  },

  handleCanvasTap(e) {
    if (this.game && this.game.player) {
      const x = e.detail.x;
      const y = e.detail.y;
      this.game.player.moveTo(x, y);
    }
  },

  initGame() {
    const ctx = wx.createCanvasContext('gameCanvas', this);
    this.game = new Game(ctx, this.data.canvasWidth, this.data.canvasHeight, this);
    this.game.start();
  }
});

// ============ 游戏核心类 ============
class Game {
  constructor(ctx, width, height, page) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.page = page;
    this.running = true;
    this.frameCount = 0;
    this.lastWaveTime = 0;
    this.waveInterval = 5000; // 波次间隔毫秒

    // 初始化游戏对象
    this.player = new Player(width / 2, height - 100, this);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.currentWave = 1;
    this.enemiesInWave = 3;
    this.waveStarted = false;
    this.waveStartTime = Date.now();
  }

  start() {
    this.gameLoop();
  }

  gameLoop() {
    if (!this.running) return;

    this.update();
    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.frameCount++;

    // 玩家更新
    this.player.update();

    // 敌人波次管理
    const now = Date.now();
    if (!this.waveStarted && now - this.waveStartTime > this.waveInterval) {
      this.spawnWave();
      this.waveStarted = true;
    }

    // 敌人更新
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(this.player);
      if (this.enemies[i].health <= 0) {
        this.enemies.splice(i, 1);
        this.page.data.score += 100;
        this.page.data.kills++;
        this.page.data.upgradePoints++;
      }
    }

    // 检查是否所有敌人都被击杀
    if (this.waveStarted && this.enemies.length === 0 && this.frameCount % 30 === 0) {
      this.completeWave();
    }

    // 投射物更新
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update();
      if (this.projectiles[i].isOffScreen()) {
        this.projectiles.splice(i, 1);
      }
    }

    // 检查投射物碰撞
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        if (this.projectiles[i].collidsWith(this.enemies[j])) {
          this.enemies[j].takeDamage(this.projectiles[i].damage);
          this.projectiles.splice(i, 1);
          this.createParticles(this.enemies[j].x, this.enemies[j].y);
          break;
        }
      }
    }

    // 敌人与玩家碰撞
    for (const enemy of this.enemies) {
      if (this.distance(this.player.x, this.player.y, enemy.x, enemy.y) < 30) {
        this.player.takeDamage(10);
        this.page.data.playerHealth = this.player.health;
        if (this.player.health <= 0) {
          this.gameOver();
        }
      }
    }

    // 粒子效果更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.page.setData({
      playerHealth: this.player.health,
      wave: this.currentWave,
      score: this.page.data.score
    });
  }

  draw() {
    // 清除画布
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 绘制网格背景
    this.drawGrid();

    // 绘制敌人
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
    }

    // 绘制投射物
    for (const projectile of this.projectiles) {
      projectile.draw(this.ctx);
    }

    // 绘制粒子
    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    // 绘制玩家
    this.player.draw(this.ctx);

    this.ctx.draw();
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i < this.width; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.height; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.width, i);
      this.ctx.stroke();
    }
  }

  spawnWave() {
    const count = this.enemiesInWave + Math.floor(this.currentWave / 2);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = this.width / 2 + Math.cos(angle) * 200;
      const y = this.height / 2 + Math.sin(angle) * 200;
      this.enemies.push(new Enemy(x, y, this));
    }
  }

  completeWave() {
    this.currentWave++;
    this.enemiesInWave = 3 + Math.floor(this.currentWave / 2);
    this.waveStarted = false;
    this.waveStartTime = Date.now();
    this.page.setData({ showUpgrade: true, upgradePoints: this.page.data.upgradePoints });
  }

  createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const vx = Math.cos(angle) * 3;
      const vy = Math.sin(angle) * 3;
      this.particles.push(new Particle(x, y, vx, vy));
    }
  }

  gameOver() {
    this.running = false;
    this.page.setData({ gameState: 'gameOver' });
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
}

// ============ 玩家类 ============
class Player {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.width = 30;
    this.height = 40;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 5;
    this.damage = 10;
    this.fireRate = 500; // 毫秒
    this.attackRange = 150;
    this.lastShootTime = 0;
    this.targetX = x;
    this.targetY = y;
    this.angle = 0;
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    // 向目标移动
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.speed) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }

    // 限制在屏幕内
    this.x = Math.max(15, Math.min(this.game.width - 15, this.x));
    this.y = Math.max(15, Math.min(this.game.height - 15, this.y));

    // 自动射击
    this.autoShoot();
  }

  autoShoot() {
    const now = Date.now();
    if (now - this.lastShootTime > this.fireRate) {
      // 找最近的敌人
      let nearest = null;
      let nearestDist = this.attackRange;

      for (const enemy of this.game.enemies) {
        const dist = this.game.distance(this.x, this.y, enemy.x, enemy.y);
        if (dist < nearestDist) {
          nearest = enemy;
          nearestDist = dist;
        }
      }

      if (nearest) {
        this.shootAt(nearest.x, nearest.y);
        this.lastShootTime = now;
      }
    }
  }

  shootAt(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const vx = (dx / distance) * 6;
      const vy = (dy / distance) * 6;
      this.game.projectiles.push(new Projectile(this.x, this.y, vx, vy, this.damage));
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  draw(ctx) {
    // 绘制身体
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(this.x - 15, this.y - 20, 30, 40);

    // 绘制头部
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 25, 10, 0, Math.PI * 2);
    ctx.fill();

    // 绘制眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 27, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 4, this.y - 27, 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制枪
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 10);
    ctx.lineTo(this.x + 15, this.y - 15);
    ctx.stroke();

    // 绘制生命值条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - 15, this.y - 40, 30, 4);
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
    ctx.fillRect(this.x - 15, this.y - 40, 30 * healthPercent, 4);
  }
}

// ============ 敌人类 ============
class Enemy {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.width = 24;
    this.height = 24;
    this.health = 20;
    this.maxHealth = 20;
    this.speed = 2;
    this.type = Math.random() > 0.5 ? 'goblin' : 'orc';
  }

  update(player) {
    // 朝玩家移动
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  draw(ctx) {
    if (this.type === 'goblin') {
      // 绿色小怪
      ctx.fillStyle = '#00cc00';
      ctx.fillRect(this.x - 12, this.y - 12, 24, 24);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath();
      ctx.arc(this.x, this.y - 14, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(this.x - 2, this.y - 15, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + 2, this.y - 15, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 紫色大怪
      ctx.fillStyle = '#cc00ff';
      ctx.fillRect(this.x - 12, this.y - 12, 24, 24);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath();
      ctx.arc(this.x, this.y - 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(this.x - 3, this.y - 16, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + 3, this.y - 16, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 生命值条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - 12, this.y - 18, 24, 2);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x - 12, this.y - 18, 24 * healthPercent, 2);
  }
}

// ============ 投射物类 ============
class Projectile {
  constructor(x, y, vx, vy, damage) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  isOffScreen() {
    return this.x < -10 || this.x > 400 || this.y < -10 || this.y > 700;
  }

  collidsWith(enemy) {
    const dx = this.x - enemy.x;
    const dy = this.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + enemy.width / 2;
  }

  draw(ctx) {
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============ 粒子效果类 ============
class Particle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = 30;
    this.maxLife = 30;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // 重力
    this.life--;
  }

  draw(ctx) {
    const opacity = this.life / this.maxLife;
    ctx.fillStyle = `rgba(255, 200, 0, ${opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}