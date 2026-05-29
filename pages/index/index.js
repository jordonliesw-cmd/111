Page({
  data: {
    gameState: 'menu',
    playerHealth: 100,
    playerMaxHealth: 100,
    wave: 1,
    score: 0,
    kills: 0,
    coins: 0,
    upgradePoints: 0,
    showUpgrade: false,
    canvasWidth: 375,
    canvasHeight: 667,
    difficulty: 'normal',
    difficultyName: '普通',
    isBossWave: false,
    currentWeaponName: '普通枪',
    leaderboard: [],
    achievements: [],
    newAchievements: [],
    weaponOptions: []
  },

  onLoad() {
    wx.getSystemInfo({
      success: (res) => {
        this.data.canvasWidth = res.windowWidth;
        this.data.canvasHeight = res.windowHeight;
      }
    });
    this.loadLeaderboard();
    this.loadAchievements();
  },

  loadLeaderboard() {
    try {
      const data = wx.getStorageSync('grandmaRampageLeaderboard');
      if (data) {
        this.data.leaderboard = data.sort((a, b) => b.score - a.score).slice(0, 10);
      } else {
        this.data.leaderboard = [
          { name: '传说老奶奶', wave: 50, score: 50000 },
          { name: '勇敢奶奶', wave: 40, score: 40000 },
          { name: '强悍奶奶', wave: 30, score: 30000 },
          { name: '你', wave: 0, score: 0 }
        ];
      }
      this.setData({ leaderboard: this.data.leaderboard });
    } catch (e) {
      console.error('加载排行榜失败', e);
    }
  },

  loadAchievements() {
    const achievements = [
      { id: 'starter', icon: '🎮', name: '初学者', description: '完成第1波', unlocked: false },
      { id: 'wave10', icon: '🌊', name: '冲浪者', description: '完成第10波', unlocked: false },
      { id: 'wave25', icon: '🏄', name: '浪人', description: '完成第25波', unlocked: false },
      { id: 'wave50', icon: '👑', name: '波次之王', description: '完成第50波', unlocked: false },
      { id: 'kills100', icon: '💀', name: '猎手', description: '击杀100个敌人', unlocked: false },
      { id: 'kills500', icon: '🔥', name: '屠夫', description: '击杀500个敌人', unlocked: false },
      { id: 'hardMode', icon: '😡', name: '勇者', description: '在困难模式下完成第10波', unlocked: false },
      { id: 'insaneMode', icon: '💀', name: '疯子', description: '在地狱模式下完成第5波', unlocked: false },
      { id: 'flamethrower', icon: '🔥', name: '火焰战士', description: '解锁喷火枪', unlocked: false },
      { id: 'laser', icon: '⚡', name: '激光侠', description: '解锁激光枪', unlocked: false },
      { id: 'bossfight', icon: '👹', name: 'Boss猎人', description: '击败第一个Boss', unlocked: false },
      { id: 'allWeapons', icon: '🎯', name: '武器大师', description: '解锁所有武器', unlocked: false }
    ];

    try {
      const saved = wx.getStorageSync('grandmaRampageAchievements');
      if (saved) {
        achievements.forEach(ach => {
          const saved_ach = saved.find(s => s.id === ach.id);
          if (saved_ach) ach.unlocked = saved_ach.unlocked;
        });
      }
    } catch (e) {
      console.error('加载成就失败', e);
    }

    this.data.achievements = achievements;
    this.setData({ achievements });
  },

  saveAchievements() {
    try {
      wx.setStorageSync('grandmaRampageAchievements', this.data.achievements);
    } catch (e) {
      console.error('保存成就失败', e);
    }
  },

  checkAchievements() {
    const newUnlocks = [];

    // 波次成就
    if (this.data.wave >= 1 && !this.findAchievement('starter').unlocked) {
      this.unlockAchievement('starter');
      newUnlocks.push(this.findAchievement('starter'));
    }
    if (this.data.wave >= 10 && !this.findAchievement('wave10').unlocked) {
      this.unlockAchievement('wave10');
      newUnlocks.push(this.findAchievement('wave10'));
    }
    if (this.data.wave >= 25 && !this.findAchievement('wave25').unlocked) {
      this.unlockAchievement('wave25');
      newUnlocks.push(this.findAchievement('wave25'));
    }
    if (this.data.wave >= 50 && !this.findAchievement('wave50').unlocked) {
      this.unlockAchievement('wave50');
      newUnlocks.push(this.findAchievement('wave50'));
    }

    // 击杀成就
    if (this.data.kills >= 100 && !this.findAchievement('kills100').unlocked) {
      this.unlockAchievement('kills100');
      newUnlocks.push(this.findAchievement('kills100'));
    }
    if (this.data.kills >= 500 && !this.findAchievement('kills500').unlocked) {
      this.unlockAchievement('kills500');
      newUnlocks.push(this.findAchievement('kills500'));
    }

    // 难度成就
    if (this.data.difficulty === 'hard' && this.data.wave >= 10 && !this.findAchievement('hardMode').unlocked) {
      this.unlockAchievement('hardMode');
      newUnlocks.push(this.findAchievement('hardMode'));
    }
    if (this.data.difficulty === 'insane' && this.data.wave >= 5 && !this.findAchievement('insaneMode').unlocked) {
      this.unlockAchievement('insaneMode');
      newUnlocks.push(this.findAchievement('insaneMode'));
    }

    this.data.newAchievements = newUnlocks;
    return newUnlocks;
  },

  findAchievement(id) {
    return this.data.achievements.find(a => a.id === id);
  },

  unlockAchievement(id) {
    const ach = this.findAchievement(id);
    if (ach) {
      ach.unlocked = true;
      this.saveAchievements();
    }
  },

  startGame() {
    this.setData({ gameState: 'selectDifficulty' });
  },

  startGameWithDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    const difficultyMap = {
      'easy': '简单',
      'normal': '普通',
      'hard': '困难',
      'insane': '地狱'
    };

    this.data.difficulty = difficulty;
    this.data.difficultyName = difficultyMap[difficulty];
    this.data.playerHealth = 100;
    this.data.playerMaxHealth = 100;
    this.data.wave = 1;
    this.data.score = 0;
    this.data.kills = 0;
    this.data.coins = 0;
    this.data.upgradePoints = 0;
    this.data.newAchievements = [];
    this.data.isBossWave = false;
    this.data.currentWeaponName = '普通枪';
    this.data.weaponOptions = this.getWeaponOptions();

    this.setData({
      gameState: 'playing',
      showUpgrade: false,
      playerHealth: 100,
      playerMaxHealth: 100,
      wave: 1,
      score: 0,
      kills: 0,
      upgradePoints: 0,
      difficulty: difficulty,
      difficultyName: difficultyMap[difficulty],
      isBossWave: false,
      currentWeaponName: '普通枪'
    });

    this.initGame();
  },

  getWeaponOptions() {
    return [
      { icon: '🔫', name: '普通枪', description: '标准射击', cost: 0 },
      { icon: '🔥', name: '喷火枪', description: '发射多枚子弹', cost: 2 },
      { icon: '⚡', name: '激光枪', description: '高穿透力', cost: 3 },
      { icon: '💥', name: '火箭枪', description: '爆炸伤害', cost: 4 }
    ];
  },

  showInstructions() {
    this.setData({ gameState: 'instructions' });
  },

  showLeaderboard() {
    this.loadLeaderboard();
    this.setData({ gameState: 'leaderboard' });
  },

  showAchievements() {
    this.setData({ gameState: 'achievements' });
  },

  backToMenu() {
    this.setData({ gameState: 'menu' });
  },

  continueGame() {
    this.setData({ showUpgrade: false });
  },

  upgradeWeapon(e) {
    const index = e.currentTarget.dataset.index;
    const weapon = this.data.weaponOptions[index];

    if (this.data.upgradePoints < weapon.cost) {
      wx.showToast({ title: '升级点数不足！', icon: 'none' });
      return;
    }

    this.data.upgradePoints -= weapon.cost;
    this.data.currentWeaponName = weapon.name;
    this.game.player.weaponType = index;

    wx.showToast({ title: `解锁了 ${weapon.name}！`, icon: 'none' });

    // 成就检查
    if (weapon.name === '喷火枪' && !this.findAchievement('flamethrower').unlocked) {
      this.unlockAchievement('flamethrower');
    }
    if (weapon.name === '激光枪' && !this.findAchievement('laser').unlocked) {
      this.unlockAchievement('laser');
    }

    this.setData({ upgradePoints: this.data.upgradePoints, currentWeaponName: weapon.name });
  },

  upgradeAttr(e) {
    const type = e.currentTarget.dataset.type;
    const costs = { damage: 1, fireRate: 1, health: 1, range: 1, speed: 1 };
    const cost = costs[type];

    if (this.data.upgradePoints < cost) {
      wx.showToast({ title: '升级点数不足！', icon: 'none' });
      return;
    }

    this.data.upgradePoints -= cost;

    switch (type) {
      case 'damage':
        this.game.player.damage += 2;
        wx.showToast({ title: '攻击力 +2', icon: 'none' });
        break;
      case 'fireRate':
        this.game.player.fireRate = Math.max(200, this.game.player.fireRate - 50);
        wx.showToast({ title: '射速提升！', icon: 'none' });
        break;
      case 'health':
        this.data.playerMaxHealth += 10;
        this.data.playerHealth = this.data.playerMaxHealth;
        this.game.player.maxHealth = this.data.playerMaxHealth;
        this.game.player.health = this.data.playerMaxHealth;
        wx.showToast({ title: '生命值 +10', icon: 'none' });
        break;
      case 'range':
        this.game.player.attackRange += 30;
        wx.showToast({ title: '射程 +30px', icon: 'none' });
        break;
      case 'speed':
        this.game.player.speed += 1;
        wx.showToast({ title: '速度提升！', icon: 'none' });
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
    this.waveInterval = 4000;

    this.player = new Player(width / 2, height - 100, this);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.drops = [];
    this.currentWave = 1;
    this.enemiesInWave = 3;
    this.waveStarted = false;
    this.waveStartTime = Date.now();
    this.bossHealth = 0;
    this.isBossWave = false;
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

    this.player.update();

    const now = Date.now();
    if (!this.waveStarted && now - this.waveStartTime > this.waveInterval) {
      this.spawnWave();
      this.waveStarted = true;
    }

    // 敌人更新
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(this.player);
      if (this.enemies[i].health <= 0) {
        const enemy = this.enemies[i];
        this.enemies.splice(i, 1);
        this.page.data.score += 100;
        this.page.data.kills++;
        this.page.data.upgradePoints++;
        this.createDrops(enemy.x, enemy.y);
        this.createParticles(enemy.x, enemy.y);
      }
    }

    // 检查是否完成波次
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

    // 投射物碰撞
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
      const dist = this.distance(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 30) {
        this.player.takeDamage(5);
        this.page.data.playerHealth = this.player.health;
        if (this.player.health <= 0) {
          this.gameOver();
        }
      }
    }

    // 掉落物品收集
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const dist = this.distance(this.player.x, this.player.y, drop.x, drop.y);
      if (dist < 40) {
        if (drop.type === 'health') {
          this.player.heal(20);
        } else if (drop.type === 'coin') {
          this.page.data.coins += 10;
        }
        this.drops.splice(i, 1);
      }
      drop.update();
    }

    // 粒子更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.page.setData({
      playerHealth: this.player.health,
      wave: this.currentWave,
      score: this.page.data.score,
      isBossWave: this.isBossWave
    });
  }

  draw() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawGrid();

    for (const drop of this.drops) {
      drop.draw(this.ctx);
    }

    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
    }

    for (const projectile of this.projectiles) {
      projectile.draw(this.ctx);
    }

    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    this.player.draw(this.ctx);

    // 绘制BOSS血条
    if (this.isBossWave && this.enemies.length > 0) {
      const boss = this.enemies[0];
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(this.width / 2 - 100, 20, 200, 10);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(this.width / 2 - 100, 20, 200 * (boss.health / boss.maxHealth), 10);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('BOSS HP: ' + Math.ceil(boss.health), this.width / 2 - 50, 35);
    }

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
    // Boss波次
    if (this.currentWave % 5 === 0) {
      this.isBossWave = true;
      this.page.data.isBossWave = true;
      const diffMult = { 'easy': 0.7, 'normal': 1, 'hard': 1.3, 'insane': 1.8 }[this.page.data.difficulty];
      this.enemies.push(new Boss(this.width / 2, this.height / 3, this, diffMult));
    } else {
      this.isBossWave = false;
      this.page.data.isBossWave = false;
      const count = 3 + Math.floor(this.currentWave / 2);
      const diffMult = { 'easy': 0.8, 'normal': 1, 'hard': 1.2, 'insane': 1.5 }[this.page.data.difficulty];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = this.width / 2 + Math.cos(angle) * 200;
        const y = this.height / 2 + Math.sin(angle) * 200;
        const types = ['goblin', 'orc', 'skeleton', 'demon'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.enemies.push(new Enemy(x, y, this, type, diffMult));
      }
    }
  }

  completeWave() {
    this.currentWave++;
    this.waveStarted = false;
    this.waveStartTime = Date.now();

    // 检查成就
    this.page.checkAchievements();

    // 如果击败BOSS
    if (this.isBossWave) {
      this.page.data.coins += 50;
      this.page.unlockAchievement('bossfight');
    }

    this.page.setData({ showUpgrade: true, upgradePoints: this.page.data.upgradePoints });
  }

  createParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const vx = Math.cos(angle) * 3;
      const vy = Math.sin(angle) * 3;
      this.particles.push(new Particle(x, y, vx, vy));
    }
  }

  createDrops(x, y) {
    if (Math.random() > 0.7) {
      const type = Math.random() > 0.5 ? 'health' : 'coin';
      this.drops.push(new Drop(x, y, type));
    }
  }

  gameOver() {
    this.running = false;

    // 保存成绩到排行榜
    try {
      const leaderboard = wx.getStorageSync('grandmaRampageLeaderboard') || [];
      leaderboard.push({
        name: '你',
        wave: this.page.data.wave,
        score: this.page.data.score
      });
      leaderboard.sort((a, b) => b.score - a.score);
      wx.setStorageSync('grandmaRampageLeaderboard', leaderboard.slice(0, 50));
    } catch (e) {
      console.error('保存排行榜失败', e);
    }

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
    this.fireRate = 500;
    this.attackRange = 150;
    this.lastShootTime = 0;
    this.targetX = x;
    this.targetY = y;
    this.weaponType = 0;
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.speed) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }

    this.x = Math.max(15, Math.min(this.game.width - 15, this.x));
    this.y = Math.max(15, Math.min(this.game.height - 15, this.y));

    this.autoShoot();
  }

  autoShoot() {
    const now = Date.now();
    if (now - this.lastShootTime > this.fireRate) {
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

      // 不同武器的射击方式
      if (this.weaponType === 0) {
        // 普通枪
        this.game.projectiles.push(new Projectile(this.x, this.y, vx, vy, this.damage, 'normal'));
      } else if (this.weaponType === 1) {
        // 喷火枪 - 多枚子弹
        for (let i = -1; i <= 1; i++) {
          const angle = Math.atan2(dy, dx) + i * 0.3;
          const pvx = Math.cos(angle) * 6;
          const pvy = Math.sin(angle) * 6;
          this.game.projectiles.push(new Projectile(this.x, this.y, pvx, pvy, this.damage * 0.8, 'fire'));
        }
      } else if (this.weaponType === 2) {
        // 激光枪 - 高穿透
        this.game.projectiles.push(new Projectile(this.x, this.y, vx, vy, this.damage * 1.5, 'laser'));
      } else if (this.weaponType === 3) {
        // 火箭枪 - 爆炸伤害
        this.game.projectiles.push(new Projectile(this.x, this.y, vx * 0.8, vy * 0.8, this.damage * 2, 'rocket'));
      }
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  draw(ctx) {
    // 身体
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(this.x - 15, this.y - 20, 30, 40);

    // 头部
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 25, 10, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 27, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 4, this.y - 27, 2, 0, Math.PI * 2);
    ctx.fill();

    // 枪
    const weaponColors = ['#333', '#ff6600', '#00ffff', '#ff0000'];
    ctx.strokeStyle = weaponColors[this.weaponType];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 10);
    ctx.lineTo(this.x + 18, this.y - 15);
    ctx.stroke();

    // 生命条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - 15, this.y - 40, 30, 4);
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
    ctx.fillRect(this.x - 15, this.y - 40, 30 * healthPercent, 4);
  }
}

// ============ 敌人类 ============
class Enemy {
  constructor(x, y, game, type = 'goblin', diffMult = 1) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.type = type;
    this.width = 24;
    this.height = 24;
    this.diffMult = diffMult;

    const stats = {
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

  update(player) {
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
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 12, this.y - 12, 24, 24);

    // 头
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 16, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 3, this.y - 16, 2, 0, Math.PI * 2);
    ctx.fill();

    // 血条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - 12, this.y - 18, 24, 2);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x - 12, this.y - 18, 24 * healthPercent, 2);
  }
}

// ============ Boss类 ============
class Boss extends Enemy {
  constructor(x, y, game, diffMult = 1) {
    super(x, y, game, 'demon', diffMult);
    this.health = 150 * diffMult;
    this.maxHealth = this.health;
    this.width = 50;
    this.height = 50;
    this.speed = 1.2;
    this.attackTimer = 0;
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }

    this.attackTimer++;
  }

  draw(ctx) {
    // Boss主体
    ctx.fillStyle = '#8800ff';
    ctx.fillRect(this.x - 25, this.y - 25, 50, 50);

    // 头
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 30, 12, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(this.x - 6, this.y - 32, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + 6, this.y - 32, 3, 0, Math.PI * 2);
    ctx.fill();

    // 血条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - 25, this.y - 40, 50, 3);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x - 25, this.y - 40, 50 * healthPercent, 3);
  }
}

// ============ 投射物类 ============
class Projectile {
  constructor(x, y, vx, vy, damage, type = 'normal') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 4;
    this.type = type;
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
    if (this.type === 'normal') {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'fire') {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'laser') {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x - this.vx * 5, this.y - this.vy * 5);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    } else if (this.type === 'rocket') {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this.x - 4, this.y - 8, 8, 16);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.x - 3, this.y + 8, 6, 4);
    }
  }
}

// ============ 掉落物品类 ============
class Drop {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -2;
    this.life = 300;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.life--;
  }

  draw(ctx) {
    if (this.type === 'health') {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - 4, this.y);
      ctx.lineTo(this.x + 4, this.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 4);
      ctx.lineTo(this.x, this.y + 4);
      ctx.stroke();
    } else if (this.type === 'coin') {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('$', this.x - 2, this.y + 2);
    }
  }
}

// ============ 粒子类 ============
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
    this.vy += 0.1;
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