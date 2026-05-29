# 🎮 狂暴老奶 - Cocos Creator 版本

一个完整的像素风格 Roguelike 游戏，用 **Cocos Creator** 引擎开发。

## ✨ 游戏特性

### 核心玩法
- 🎮 像素艺术风格
- 🌊 Roguelike 机制 - 无限波次
- 👵 老奶奶主角 - 可升级的武器系统
- 👹 4种敌人类型 + Boss战
- 💪 升级系统 - 攻击力、射速、生命值、射程、速度
- 🎯 难度选择 - 简单/普通/困难/地狱

### 武器系统
- 🔴 普通枪 - 基础射击
- 🔥 喷火枪 - 3发扇形射击
- ⚡ 激光枪 - 穿透力强，高伤害
- 💥 火箭枪 - 爆炸伤害，最高输出

### 敌人类型
- 🟢 小怪(Goblin) - 速度快
- 🟣 兽人(Orc) - 血多
- ⚪ 骷髅(Skeleton) - 均衡
- 🔴 恶魔(Demon) - 最强
- 👹 Boss - 每5波出现

### 高级系统
- 🏆 排行榜 - 本地最高分
- 🌟 成就系统 - 12个成就
- 💰 掉落物品 - 生命药水和金币
- 📊 游戏统计 - 分数、波次、击杀数

## 🚀 快速开始

### 环境要求
- Cocos Creator 3.x（推荐 3.4+）
- Node.js 12+
- 支持的系统：Windows、Mac、Linux

### 安装步骤

1. **下载 Cocos Creator**
   - 访问 https://www.cocos.com/en/creator
   - 下载并安装编辑器

2. **打开项目**
   ```bash
   # 用 Cocos Creator 编辑器打开此项目文件夹
   ```

3. **运行游戏**
   - 在编辑器中点击 Play（播放按钮）
   - 或按 `Ctrl+P`（Windows）/ `Cmd+P`（Mac）

4. **构建项目**
   ```bash
   # 在编辑器顶部菜单：Project → Build
   # 选择目标平台（Web、Android、iOS等）
   ```

## 📁 项目结构

```
111/
├── assets/
│   ├── scenes/
│   │   └── MainScene.ts       # 主游戏场景
│   ├── scripts/
│   │   ├── GameManager.ts     # 游戏管理器
│   │   └── ...
│   ├── resources/             # 图片、音频资源
│   └── ...
├── cocos.json                 # Cocos 项目配置
├── project.json               # 项目配置
├── package.json               # NPM 依赖
└── README.md                  # 本文件
```

## 🎮 游戏玩法

### 操作方式
1. **移动** - 点击或拖动屏幕移动老奶奶
2. **攻击** - 自动射击范围内的敌人
3. **升级** - 每波结束后选择升级项目
4. **收集** - 击杀敌人掉落的物品自动收集

### 升级策略
- **早期** - 优先升级生命值和攻击力
- **中期** - 平衡射速和射程
- **晚期** - 根据难度灵活调整

### 难度差异
- 🟢 **简单** - 敌人×0.8，升级快速
- 🟡 **普通** - 标准难度（推荐）
- 🔴 **困难** - 敌人×1.2，强力Boss
- ⚫ **地狱** - 敌人×1.5，极限挑战

## 🔧 开发指南

### 修改游戏参数

#### 敌人难度
```typescript
// assets/scenes/MainScene.ts
const stats: any = {
    'goblin': { health: 20, speed: 2, color: '#00cc00' },
    'orc': { health: 30, speed: 1.8, color: '#cc00ff' },
    // ↑ 修改这些数值
};
```

#### 波次难度
```typescript
// assets/scenes/MainScene.ts
const count = 3 + Math.floor(this.currentWave / 2);
// ↑ 修改这个公式改变敌人数量
```

#### 玩家属性
```typescript
// assets/scenes/MainScene.ts
class Player {
    health: number = 100;      // 初始生命值
    damage: number = 10;       // 初始伤害
    fireRate: number = 500;    // 射击间隔
    attackRange: number = 150; // 攻击范围
    speed: number = 5;         // 移动速度
}
```

### 添加新功能

#### 添加新敌人类型
```typescript
// 1. 在 spawnWave 方法中
const types = ['goblin', 'orc', 'skeleton', 'demon', 'ghost'];

// 2. 在 Enemy 类中定义
const stats: any = {
    'ghost': { health: 15, speed: 3, color: '#00aaff' }
};

// 3. 在 draw 方法中绘制
if (this.type === 'ghost') {
    // 绘制幽灵
}
```

#### 添加新武器
```typescript
// 在 Player 类的 autoShoot 方法中
if (this.weaponType === 1) {
    // 喷火枪逻辑
    for (let i = -1; i <= 1; i++) {
        // 发射三发子弹
    }
}
```

## 📚 Cocos Creator 快速参考

### 常用 API

```typescript
// 节点操作
this.node.setPosition(100, 100);
this.node.active = false;  // 隐藏
this.node.active = true;   // 显示

// 组件操作
this.node.getComponent(Graphics);
this.node.addComponent(Component);
this.node.removeComponent(Component);

// 输入处理
this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);

// 向量计算
Vec2.distance(pos1, pos2);
Vec2.normalize(v);
Vec2.scaleAndAdd(out, v1, v2, scale);
```

### 生命周期

```typescript
class MyComponent extends Component {
    onLoad() {      // 组件加载时
    }
    
    start() {       // 第一帧前
    }
    
    update(dt) {    // 每帧执行
    }
    
    lateUpdate(dt) {// 每帧后期执行
    }
    
    onEnable() {    // 组件启用时
    }
    
    onDisable() {   // 组件禁用时
    }
}
```

## 🎨 美术资源

游戏使用纯代码绘制的像素风格图形，无需外部资源。

## 🔊 音效

目前暂未实现音效系统，可通过以下方式添加：

```typescript
// 播放音效
const audio = this.getComponent(AudioSource);
audio.play();

// 播放背景音乐
audioEngine.playMusic('path/to/music.mp3', true);
```

## 📊 性能优化建议

1. **对象池** - 复用敌人和投射物
2. **延迟更新** - 不是每帧都更新UI
3. **裁剪检查** - 只渲染可见对象
4. **减少 GC** - 避免频繁创建销毁对象

## 🐛 已知问题

- 在极低配置手机上可能卡顿
- 敌人最多约200个时性能明显下降

## 🚀 未来计划

- [ ] 背景音乐和音效
- [ ] 皮肤系统
- [ ] 多人在线排行榜
- [ ] 新技能系统
- [ ] 每日挑战
- [ ] 故事模式
- [ ] 更多敌人类型
- [ ] 特殊关卡

## 📖 学习资源

- **Cocos Creator 官方文档** - https://docs.cocos.com/creator/3.x/
- **API 文档** - https://docs.cocos.com/creator/api/
- **官方教程** - https://www.cocos.com/en/creator
- **社区论坛** - https://discuss.cocos2d-x.org/

## 📝 许可证

MIT License - 自由使用和修改

## 💬 反馈和贡献

欢迎提交 Issue 和 Pull Request！

---

**祝你游戏开发愉快！** 🎮👵🔫

**最后更新** - 2026年5月29日
**版本** - 1.0 完整版
