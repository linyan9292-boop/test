<template>
  <div class="page-container">
    <div class="page-content">
      <h1 class="page-title">装备副本</h1>

      <div class="card dungeon-list">
        <div v-for="dungeon in dungeons" :key="dungeon.id" class="dungeon-card">
          <div class="dungeon-header">
            <div class="dungeon-info">
              <div class="dungeon-name">{{ dungeon.name }}</div>
              <div class="dungeon-sub">{{ dungeon.description }}</div>
            </div>
            <span class="dungeon-tag">推荐战力 {{ dungeon.recommendedPower.toLocaleString() }}+</span>
          </div>

          <div class="dungeon-rewards">
            <h4 class="rewards-title">主要掉落</h4>
            <div class="rewards-list">
              <span v-for="reward in dungeon.rewards" :key="reward" class="reward-tag">{{ reward }}</span>
            </div>
          </div>

          <div class="dungeon-footer">
            <div class="reward-preview">预计收益：{{ dungeon.estimatedReward }}</div>
            <button class="enter-btn" @click="enterDungeon(dungeon)">进入挑战</button>
          </div>
        </div>
      </div>

      <!-- 战斗弹窗 -->
      <div v-if="showBattle" class="battle-overlay" @click="closeBattle">
        <div class="battle-content" @click.stop>
          <h3 class="battle-title">{{ currentDungeon.name }}</h3>

          <div class="battle-info">
            <div class="battle-stats">
              <div class="stat-item">
                <span class="stat-label">敌方战力</span>
                <span class="stat-value">{{ currentDungeon.enemyPower.toLocaleString() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">推荐战力</span>
                <span class="stat-value">{{ currentDungeon.recommendedPower.toLocaleString() }}</span>
              </div>
            </div>

            <div class="battle-progress" v-if="battleProgress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: battleProgress + '%' }"></div>
              </div>
              <div class="progress-text">战斗进度: {{ battleProgress }}%</div>
            </div>
          </div>

          <div class="battle-actions">
            <button v-if="!battleInProgress" class="btn btn-primary" @click="startBattle">开始战斗</button>
            <button v-if="battleInProgress" class="btn btn-secondary" @click="skipBattle">跳过战斗</button>
            <button class="btn btn-tertiary" @click="closeBattle">返回</button>
          </div>

          <div v-if="battleResult" class="battle-result">
            <h4 class="result-title">{{ battleResult.success ? '战斗胜利！' : '战斗失败' }}</h4>
            <div v-if="battleResult.success && battleResult.expReward" class="exp-reward">
              <span class="exp-text">获得经验: +{{ battleResult.expReward }}</span>
            </div>
            <div class="result-rewards">
              <div v-for="reward in battleResult.rewards" :key="reward.item" class="result-reward">
                <span class="reward-item">{{ reward.item }}</span>
                <span class="reward-count">×{{ reward.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { colors } from '@/styles/colors.js'
import { deck, teamSlots, getTeamPower } from '@/store/gameStore.js'
import { addEquipment } from '@/store/inventoryStore.js'

// 获取牌组数据
// const { deck } = useDeck()

// 副本数据
const dungeons = ref([
  {
    id: 1,
    name: '武器试炼场',
    description: '获取各类武器装备和强化素材',
    recommendedPower: 8000,
    enemyPower: 7500,
    rewards: ['铁剑', '钢盾', '强化石', '武器碎片'],
    estimatedReward: '装备碎片 × 30'
  },
  {
    id: 2,
    name: '护甲熔炉',
    description: '获取防具和防御强化材料',
    recommendedPower: 12000,
    enemyPower: 11000,
    rewards: ['皮甲', '铁甲', '防御卷轴', '护甲碎片'],
    estimatedReward: '护甲碎片 × 25'
  },
  {
    id: 3,
    name: '元素秘境',
    description: '获取元素属性装备和稀有材料',
    recommendedPower: 15000,
    enemyPower: 14000,
    rewards: ['火焰宝石', '冰霜护符', '雷电核心', '元素碎片'],
    estimatedReward: '元素碎片 × 20'
  },
  {
    id: 4,
    name: '远古遗迹',
    description: '获取传说级装备和史诗材料',
    recommendedPower: 20000,
    enemyPower: 18000,
    rewards: ['传说之剑', '史诗护甲', '远古精华', '传说碎片'],
    estimatedReward: '传说碎片 × 15'
  }
])

// 战斗状态
const showBattle = ref(false)
const currentDungeon = ref(null)
const battleInProgress = ref(false)
const battleProgress = ref(0)
const battleResult = ref(null)

// 计算队伍总战力
const teamPower = computed(() => getTeamPower())

// 进入副本
const enterDungeon = (dungeon) => {
  currentDungeon.value = dungeon
  battleResult.value = null
  battleProgress.value = 0
  battleInProgress.value = false
  showBattle.value = true
}

// 关闭战斗弹窗
const closeBattle = () => {
  showBattle.value = false
  currentDungeon.value = null
  battleResult.value = null
  battleProgress.value = 0
  battleInProgress.value = false
}

// 开始战斗
const startBattle = () => {
  if (!teamSlots.value || teamSlots.value.filter(Boolean).length === 0) {
    alert('请先配置队伍后再进行战斗！')
    return
  }

  battleInProgress.value = true
  battleProgress.value = 0
  battleResult.value = null

  // 自动化战斗动画
  const teamPower = getTeamPower()
  const enemyPower = currentDungeon.value.enemyPower
  const winChance = Math.min(0.9, Math.max(0.1, teamPower / (teamPower + enemyPower)))
  const willWin = Math.random() < winChance

  let progress = 0
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15 + 5 // 随机进度增长
    battleProgress.value = Math.min(progress, 100)

    if (battleProgress.value >= 100) {
      clearInterval(progressInterval)
      finishBattle(willWin)
    }
  }, 300)
}

// 跳过战斗
const skipBattle = () => {
  battleProgress.value = 100
  finishBattle()
}

// 装备属性生成函数
const getItemType = (itemName) => {
  if (itemName.includes('剑') || itemName.includes('武器')) return '武器'
  if (itemName.includes('盾') || itemName.includes('甲')) return '防具'
  if (itemName.includes('宝石') || itemName.includes('护符') || itemName.includes('核心')) return '饰品'
  return '材料'
}

const getItemRarity = (dungeonId) => {
  const rarities = ['普通', '精良', '稀有', '史诗']
  return rarities[Math.min(dungeonId - 1, 3)]
}

const getItemPower = (itemName, dungeonId) => {
  const basePower = dungeonId * 200
  const typeBonus = getItemType(itemName) === '武器' ? 100 : 50
  return basePower + typeBonus
}

const getItemStat = (itemName, statType) => {
  const type = getItemType(itemName)
  const baseValue = {
    '武器': { atk: 50, def: 10, hp: 20, spd: 5 },
    '防具': { atk: 5, def: 40, hp: 50, spd: 0 },
    '饰品': { atk: 15, def: 15, hp: 30, spd: 10 },
    '材料': { atk: 10, def: 10, hp: 10, spd: 5 }
  }
  return baseValue[type]?.[statType] || 0
}

// 完成战斗
const finishBattle = (willWin) => {
  battleInProgress.value = false
  battleProgress.value = 100

  const success = willWin || (teamPower.value >= currentDungeon.value.recommendedPower && Math.random() > 0.3)

  if (success) {
    // 获得经验奖励
    const expReward = currentDungeon.value.id * 50 + Math.floor(Math.random() * 100)
    grantGlobalExp(expReward)
    
    // 生成奖励并添加到背包
    const rewards = currentDungeon.value.rewards.map(item => {
      const count = Math.floor(Math.random() * 5) + 3
      const equipmentData = {
        name: item,
        type: getItemType(item),
        rarity: getItemRarity(currentDungeon.value.id),
        power: getItemPower(item, currentDungeon.value.id),
        atk: getItemStat(item, 'atk'),
        def: getItemStat(item, 'def'),
        hp: getItemStat(item, 'hp'),
        spd: getItemStat(item, 'spd')
      }

      // 添加装备到背包
      for (let i = 0; i < count; i++) {
        addEquipment(equipmentData)
      }

      return { item, count }
    })

    battleResult.value = {
      success: true,
      rewards,
      expReward
    }
  } else {
    battleResult.value = {
      success: false,
      rewards: [{ item: '安慰奖', count: 1 }]
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem 5rem;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
  color: v-bind('colors.text.primary');
  display: grid;
  gap: 1.2rem;
}

.page-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

/* 通用卡片 */
.card {
  background-color: v-bind('colors.background.content');
  padding: 1rem 1.2rem;
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

/* 副本列表 */
.dungeon-list {
  display: grid;
  gap: 0.8rem;
}

.dungeon-card {
  background-color: v-bind('colors.background.primary');
  border-radius: 10px;
  border: 1px solid v-bind('colors.border.primary');
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition: all 0.2s ease;
}

.dungeon-card:hover {
  border-color: v-bind('colors.brand.primary');
  transform: translateY(-2px);
}

.dungeon-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
}

.dungeon-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dungeon-name {
  font-size: 1rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.dungeon-sub {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.dungeon-tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
  white-space: nowrap;
}

/* 副本奖励 */
.dungeon-rewards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rewards-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.reward-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
}

/* 副本底部 */
.dungeon-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.reward-preview {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.enter-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #f9fafb;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.enter-btn:hover {
  filter: brightness(1.05);
}

/* 战斗弹窗 */
.battle-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
}

.battle-content {
  background-color: v-bind('colors.background.content');
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.battle-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.battle-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.battle-stats {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: v-bind('colors.text.secondary');
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.battle-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: v-bind('colors.background.primary');
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
  text-align: center;
}

.battle-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #f9fafb;
}

.btn-secondary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #f9fafb;
}

.btn-tertiary {
  background-color: transparent;
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
}

.btn:hover {
  filter: brightness(1.05);
}

.battle-result {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.exp-reward {
  text-align: center;
  padding: 0.5rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.exp-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #78350f;
}

.result-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.result-rewards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-reward {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: v-bind('colors.background.content');
  border-radius: 6px;
}

.reward-item {
  font-size: 0.85rem;
  color: v-bind('colors.text.primary');
}

.reward-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('colors.brand.primary');
}

/* 响应式设计 */
@media (max-width: 480px) {
  .page-container {
    padding: 1rem 0.75rem 5rem;
  }

  .dungeon-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .enter-btn {
    width: 100%;
    text-align: center;
  }

  .battle-stats {
    flex-direction: column;
    gap: 0.5rem;
  }

  .battle-actions {
    flex-direction: column;
  }
}
</style>
