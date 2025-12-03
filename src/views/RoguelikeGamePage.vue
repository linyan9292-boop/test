<template>
  <div class="page-container">
    <div class="page-content">
      <!-- 页面标题 + 钱石 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">抽卡闯关</h1>
          <p class="page-subtitle">{{ currentPool ? currentPool.name : '加载卡池中...' }}</p>
        </div>
        <div class="header-right">
          <span class="wallet-text">钻石：{{ diamonds }}</span>
          <router-link to="/recharge" class="btn-charge">去充值</router-link>
        </div>
      </div>

      <!-- 关卡进度卡片 -->
      <div class="card progress-card">
        <div class="progress-item">
          <span class="progress-label">当前关卡</span>
          <span class="progress-value">{{ stage }}/{{ MAX_STAGE }}</span>
        </div>
        <div class="progress-item">
          <span class="progress-label">队伍战力</span>
          <span class="progress-value">{{ power }}</span>
        </div>
        <div class="progress-item">
          <span class="progress-label">推荐战力</span>
          <span class="progress-value">{{ recommendPower }}</span>
        </div>
      </div>

      <!-- 卡池未加载提示 -->
      <div v-if="!currentPool" class="card loading-card">
        <p class="loading-text">卡池加载中或不存在...</p>
      </div>

      <!-- 操作区：UP选择 + 按钮组 -->
      <div v-else class="card action-card">
        <!-- UP选择（若卡池支持） -->
        <div v-if="isSelectableUpPool" class="up-section">
          <h3 class="section-title">限定UP选择</h3>
          <div class="up-grid">
            <div v-for="card in upCardDetails" :key="card.id"
              :class="['up-item', `rarity-border-${card.rarity.toLowerCase()}`, { 'up-selected': selectedUpCard === card.id }]"
              @click="selectUpCard(card.id)">
              <img :src="card.imageUrl" :alt="card.name" class="up-image" />
            </div>
          </div>
        </div>

        <!-- 操作按钮组 -->
        <div class="action-buttons">
          <button class="btn btn-primary" @click="doTenPull" :disabled="isAnimating">十连抽（{{ PRICES.tenPull }} 钻）</button>
          <button class="btn btn-success" @click="fight" :disabled="isAnimating">
            {{ battleState === 'idle' ? '开始战斗' : battleState === 'fighting' ? '下一回合' : '重新开始' }}
          </button>
          <button class="btn btn-ghost" @click="openBuffPanel" :disabled="isAnimating">选择事件 / Buff</button>
          <router-link to="/chouka" class="btn btn-tertiary">返回抽卡主页</router-link>
        </div>
      </div>

      <!-- Buff选择弹窗 -->
      <div v-if="showBuffPanel" class="card buff-card">
        <h3 class="section-title">事件选择：请选择一个Buff</h3>
        <div class="buff-grid">
          <button v-for="b in chooseBuffs" :key="b.id" class="btn btn-buff" @click="pickBuff(b)">{{ b.name }}</button>
        </div>
      </div>

      <!-- 战斗界面 -->
      <div class="card battle-card">
        <h3 class="section-title">
          {{ currentStageConfig?.name || '战斗' }}
          <span v-if="currentStageConfig?.isBoss" class="boss-tag">BOSS</span>
        </h3>

        <!-- 战斗状态显示 -->
        <div v-if="battleState !== 'idle'" class="battle-state">
          <div class="battle-header">
            <span class="battle-turn">第 {{ currentTurn }} 回合</span>
            <span :class="['battle-status', `status-${battleState}`]">
              {{ battleState === 'fighting' ? '战斗中' : battleState === 'victory' ? '胜利' : '失败' }}
            </span>
          </div>

          <!-- 血条显示 -->
          <div class="battle-hp">
            <div class="hp-section">
              <div class="hp-label">我方 HP: {{ playerHP }}</div>
              <div class="hp-bar">
                <div class="hp-fill player-hp" :style="{ width: (playerHP / (teamSlots.filter(Boolean).reduce((sum, c) => sum + (c.hp || 0), 0)) * 100) + '%' }"></div>
              </div>
            </div>
            <div class="hp-section">
              <div class="hp-label">敌方 HP: {{ enemyHP }}</div>
              <div class="hp-bar">
                <div class="hp-fill enemy-hp" :style="{ width: (enemyHP / (enemyTeam.reduce((sum, e) => sum + (e.hp || 0), 0)) * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 战斗日志 -->
          <div class="battle-log">
            <div class="log-title">战斗日志</div>
            <div class="log-content">
              <div v-for="(log, index) in battleLog" :key="index" class="log-item">{{ log }}</div>
            </div>
          </div>
        </div>

        <!-- 战斗预览（非战斗状态） -->
        <div v-else class="battle-preview">
          <div class="battle-panels">
            <!-- 我方队伍 -->
            <div class="team-panel">
              <div class="panel-header">
                <span class="panel-title">我方队伍</span>
                <span class="panel-sub">总战力 {{ power }}</span>
              </div>
              <div class="panel-stats">
                <div class="stat-item">
                  <span class="stat-label">队伍速度</span>
                  <span class="stat-value">{{ teamSpeed }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">推荐战力</span>
                  <span class="stat-value">{{ recommendPower }}</span>
                </div>
              </div>
              <div class="panel-members">
                <span v-for="(c, i) in teamSlots.filter(Boolean)" :key="'team_'+c.id + '_' + i" :class="`member-tag text-rarity-${c.rarity.toLowerCase()}`">{{ c.name }}</span>
              </div>
            </div>

            <!-- 敌方队伍 -->
            <div class="team-panel">
              <div class="panel-header">
                <span class="panel-title">敌方队伍</span>
                <span class="panel-sub">总战力 {{ enemyPower }}</span>
              </div>
              <div class="panel-members">
                <span v-for="(e, i) in enemyTeam" :key="'enemy_'+e.id + '_' + i" :class="`member-tag text-rarity-${e.rarity.toLowerCase()}`">{{ e.name }} Lv{{ e.level }}</span>
                <p v-if="enemyTeam.length === 0" class="empty-text">当前卡池暂无敌方预览</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前牌组卡片 -->
      <div class="card deck-card">
        <h3 class="section-title">当前牌组（累计）</h3>
        <div class="deck-list">
          <span v-for="(c, i) in deck" :key="'deck_'+c.id + '_' + i" :class="`member-tag text-rarity-${c.rarity.toLowerCase()}`">{{ c.name }} Lv{{ c.level || 0 }}</span>
          <p v-if="deck.length === 0" class="empty-text">尚未抽取任何角色</p>
        </div>
      </div>

      <!-- 结算面板 -->
      <div v-if="showSummary" class="card summary-card">
        <h3 class="section-title">结算面板</h3>
        <div class="summary-info">
          <div class="summary-item">
            <span class="summary-label">总战力</span>
            <span class="summary-value">{{ power }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">通关关卡</span>
            <span class="summary-value">{{ MAX_STAGE }}</span>
          </div>
        </div>
        <div class="summary-members">
          <span v-for="(c, i) in deck" :key="'sum_'+c.id + '_' + i" :class="`member-tag text-rarity-${c.rarity.toLowerCase()}`">{{ c.name }} Lv{{ c.level || 0 }}</span>
        </div>
        <button class="btn btn-primary" @click="() => { showSummary.value = false; resetRun() }">再来一次</button>
      </div>

      <!-- 抽卡结果弹窗 -->
      <div v-if="showGachaResultOverlay" class="gacha-overlay">
        <div class="overlay-content">
          <h2 class="overlay-title">恭喜获得</h2>
          <div class="cards-container" ref="cardsContainerRef">
            <transition-group name="card-reveal" tag="div" class="cards-grid">
              <div v-for="(card, index) in displayedCards" :key="card.id + '_' + index"
                :class="['card-item', `rarity-bg-${card.rarity.toLowerCase()}`]">
                <div :class="['card-image-wrapper', `rarity-border-${card.rarity.toLowerCase()}`, { 'highlight-rarity': isHighlightRarity(card.rarity) }]">
                  <img :src="card.imageUrl || '/images/cards/1101.webp'" :alt="card.name" class="card-image">
                </div>
                <p class="card-name">{{ card.name }}</p>
              </div>
            </transition-group>
          </div>
          <button @click="confirmGachaResult" class="btn btn-confirm" :disabled="isAnimating">{{ isAnimating ? '...' : '确定' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useGacha } from '@/utils/useGacha'
import * as RARITY from '@/data/rarity.js'
import { cardMap } from '@/data/cards'
import { colors } from '@/styles/colors.js'
import { getGachaSource } from '@/utils/getGachaSource.js'
import { diamonds as walletDiamonds, spendDiamonds, refreshWallet } from '@/store/walletStore.js'
import { PRICES } from '@/config/commerce.js'
import { deck, addCardsToDeck, randomBuffChoices, addBuff, resetRun, grantGlobalExp, teamSlots, getTeamPower } from '@/store/gameStore.js'
import { getStageConfig, getThemeConfig } from '@/data/stages.js'

const route = useRoute()
const diamonds = walletDiamonds
const refreshDiamonds = () => { refreshWallet() }

const MAX_STAGE = 10
const stage = ref(1)
const power = computed(() => getTeamPower())
const currentStageConfig = computed(() => getStageConfig(stage.value))
const recommendPower = computed(() => currentStageConfig.value?.recommendPower || 80)
  const cards = (currentPool.value?.cards || []).filter(c => c && c.rarity === RARITY.SSR).slice(0, 3)
  const statByRarity = (r) => {
    if (r === RARITY.SP) return { atk: 120, def: 90, hp: 1200, spd: 110 }
    if (r === RARITY.SSR) return { atk: 100, def: 80, hp: 1000, spd: 105 }
    if (r === RARITY.SR) return { atk: 80, def: 60, hp: 800, spd: 100 }
    return { atk: 60, def: 40, hp: 600, spd: 95 }
  }
  return cards.map((c, idx) => {
    const base = statByRarity(c.rarity)
    const level = Math.min(3, stage.value + idx)
    return { ...c, level, atk: base.atk + level * 5, def: base.def + level * 4, hp: base.hp + level * 30, spd: base.spd + Math.floor(level / 2) }
  })
})
const enemyPower = computed(() => enemyTeam.value.reduce((s, c) => s + Math.floor(( (c.rarity === RARITY.SSR ? 5 : 1) + c.level + (c.atk*0.5 + c.def*0.3 + c.spd*0.2)/100)), 0))

const selectedUpCard = ref(null)
const gachaSource = computed(() => getGachaSource(route))
const { currentPool, lastPulledCards, performTenPulls } = useGacha(gachaSource, selectedUpCard, ref(false))

const isSelectableUpPool = computed(() => currentPool.value?.rules?.[RARITY.SP]?.SelectUpCards === true)
const upCardDetails = computed(() => {
  if (!isSelectableUpPool.value) return []
  const upCardIds = currentPool.value.rules.SP.UpCards || []
  return upCardIds.map(id => cardMap.get(id)).filter(Boolean)
})

const selectUpCard = (cardId) => { selectedUpCard.value = cardId }

const isAnimating = ref(false)
const showGachaResultOverlay = ref(false)
const displayedCards = ref([])
let animationTimeout = null
const cardsContainerRef = ref(null)

const isHighlightRarity = (rarity) => rarity === RARITY.SP || rarity === RARITY.SSR
const getDelayTime = (rarity) => rarity === RARITY.SP ? 1000 : (rarity === RARITY.SSR ? 500 : 100)

const startPullAnimation = () => {
  displayedCards.value = []
  isAnimating.value = true
  const cardsToAnimate = lastPulledCards.value
  let index = 0
  function revealNextCard() {
    if (index < cardsToAnimate.length) {
      const card = cardsToAnimate[index]
      const delay = getDelayTime(card.rarity)
      displayedCards.value.push(card)
      nextTick(() => { if (cardsContainerRef.value) { cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight } })
      index++
      animationTimeout = setTimeout(revealNextCard, delay)
    } else {
      isAnimating.value = false
    }
  }
  revealNextCard()
}

const stopAnimation = () => {
  if (animationTimeout) clearTimeout(animationTimeout)
  isAnimating.value = false
  displayedCards.value = lastPulledCards.value
  nextTick(() => { if (cardsContainerRef.value) { cardsContainerRef.value.scrollTop = cardsContainerRef.value.scrollHeight } })
}

const confirmGachaResult = () => { if (isAnimating.value) { stopAnimation() } else { showGachaResultOverlay.value = false } }


const doTenPull = () => {
  const cost = PRICES.tenPull
  if (!spendDiamonds(cost)) {
    alert('钻石不足，请前往充值。')
    return
  }
  refreshDiamonds()
  performTenPulls()
  const cards = [...lastPulledCards.value]
  addCardsToDeck(cards)
  grantGlobalExp(10)
  showGachaResultOverlay.value = true
  nextTick(startPullAnimation)
}

const teamSpeed = computed(() => teamSlots.value.reduce((s, c) => s + (c ? (c.spd || 0) : 0), 0))
// 战斗状态
const battleState = ref('idle') // idle, fighting, victory, defeat
const currentTurn = ref(0)
const battleLog = ref([])
const playerHP = ref(100)
const enemyHP = ref(100)

// 初始化战斗
const initBattle = () => {
  battleState.value = 'fighting'
  currentTurn.value = 0
  battleLog.value = []

  // 计算初始HP
  const playerTeam = teamSlots.value.filter(Boolean)
  playerHP.value = playerTeam.reduce((sum, c) => sum + (c.hp || 0), 0)

  const enemyTeam = enemyTeam.value
  enemyHP.value = enemyTeam.reduce((sum, e) => sum + (e.hp || 0), 0)

  addBattleLog('战斗开始！')
}

// 执行战斗回合
const executeTurn = () => {
  currentTurn.value++
  const turnInfo = `第 ${currentTurn.value} 回合`

  // 计算我方伤害
  const playerTeam = teamSlots.value.filter(Boolean)
  const playerATK = playerTeam.reduce((sum, c) => sum + (c.atk || 0), 0)
  const playerSPD = playerTeam.reduce((sum, c) => sum + (c.spd || 0), 0)

  // 计算敌方伤害
  const enemyATK = enemyTeam.value.reduce((sum, e) => sum + (e.atk || 0), 0)
  const enemyDEF = enemyTeam.value.reduce((sum, e) => sum + (e.def || 0), 0)
  const enemySPD = enemyTeam.value.reduce((sum, e) => sum + (e.spd || 0), 0)

  // 伤害计算
  let playerDamage = Math.max(1, Math.floor(playerATK * 0.8 - enemyDEF * 0.3))
  let enemyDamage = Math.max(1, Math.floor(enemyATK * 0.7 - playerTeam.reduce((sum, c) => sum + (c.def || 0), 0) * 0.3))

  // 速度加成
  if (playerSPD > enemySPD) {
    playerDamage = Math.floor(playerDamage * 1.2)
  }

  // 应用伤害
  enemyHP.value = Math.max(0, enemyHP.value - playerDamage)
  playerHP.value = Math.max(0, playerHP.value - enemyDamage)

  addBattleLog(`${turnInfo} - 我方造成 ${playerDamage} 点伤害`)
  addBattleLog(`${turnInfo} - 敌方造成 ${enemyDamage} 点伤害`)

  // 检查战斗结束
  if (enemyHP.value <= 0) {
    battleState.value = 'victory'
    addBattleLog('战斗胜利！')
    setTimeout(() => {
      if (stage.value < MAX_STAGE) {
        stage.value++
        battleState.value = 'idle'
      } else {
        alert('恭喜通关！')
        showSummary.value = true
      }
    }, 1500)
  } else if (playerHP.value <= 0) {
    battleState.value = 'defeat'
    addBattleLog('战斗失败...')
    setTimeout(() => {
      battleState.value = 'idle'
      alert('战斗失败，请提升实力后再次挑战！')
    }, 1500)
  }
}

// 添加战斗日志
const addBattleLog = (message) => {
  battleLog.value.unshift(message)
  if (battleLog.value.length > 5) {
    battleLog.value.pop()
  }
}

// 战斗按钮
const fight = () => {
  if (battleState.value === 'idle') {
    initBattle()
  } else if (battleState.value === 'fighting') {
    executeTurn()
  }
}

const chooseBuffs = ref([])
const showBuffPanel = ref(false)
const openBuffPanel = () => { chooseBuffs.value = randomBuffChoices(); showBuffPanel.value = true }
const pickBuff = (buff) => { addBuff(buff); showBuffPanel.value = false }
const showSummary = ref(false)

</script>

<style scoped>
/* 页面容器与布局 */
.page-container {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 1.5rem 1rem 5rem;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
  color: v-bind('colors.text.primary');
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 通用卡片样式 */
.card {
  background-color: v-bind('colors.background.content');
  padding: 1rem 1.2rem;
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.page-subtitle {
  font-size: 0.9rem;
  color: v-bind('colors.text.secondary');
  margin: 0;
}

.header-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.wallet-text {
  font-size: 0.85rem;
  color: v-bind('colors.text.primary');
}

.btn-charge {
  background-color: v-bind('colors.brand.primary');
  color: white;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.btn-charge:hover {
  background-color: v-bind('colors.brand.hover');
}

/* 进度卡片 */
.progress-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 80px;
}

.progress-label {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.progress-value {
  font-size: 1rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

/* 加载卡片 */
.loading-card {
  text-align: center;
}

.loading-text {
  color: v-bind('colors.text.secondary');
  font-size: 0.9rem;
  margin: 0;
}

/* 操作卡片 */
.action-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.up-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.up-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.up-item {
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  border: 4px solid transparent;
  transition: all 0.2s ease;
}

.up-item.up-selected {
  border-color: v-bind('colors.brand.primary');
  transform: scale(1.05);
}

.up-image {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* 通用按钮样式 */
.btn {
  cursor: pointer;
  border: none;
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #f9fafb;
}

.btn-primary:not(:disabled):hover {
  filter: brightness(1.05);
}

.btn-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #022c22;
}

.btn-success:not(:disabled):hover {
  filter: brightness(1.05);
}

.btn-ghost {
  background-color: transparent;
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
}

.btn-ghost:not(:disabled):hover {
  background-color: v-bind('colors.background.primary');
}

.btn-tertiary {
  background-color: transparent;
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
  padding: 0.5rem 0.8rem;
}

.btn-tertiary:hover {
  background-color: v-bind('colors.background.primary');
}

/* Buff卡片 */
.buff-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.buff-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-buff {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.primary');
  padding: 0.5rem 0.8rem;
  font-size: 0.85rem;
}

.btn-buff:hover {
  background-color: v-bind('colors.border.primary');
}

/* 战斗预览卡片 */
.battle-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.battle-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}

.team-panel {
  background-color: v-bind('colors.background.primary');
  border-radius: 10px;
  padding: 0.8rem 1rem;
  border: 1px solid v-bind('colors.border.primary');
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.panel-sub {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.panel-stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-label {
  font-size: 0.75rem;
  color: v-bind('colors.text.secondary');
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.panel-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
}

.member-tag {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
}

.empty-text {
  color: v-bind('colors.text.secondary');
  font-size: 0.8rem;
  margin: 0;
}

/* 牌组卡片 */
.deck-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.battle-card .section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.boss-tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  background-color: v-bind('colors.status.error');
  color: white;
  border-radius: 12px;
  font-weight: 600;
}

/* 战斗状态 */
.battle-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: v-bind('colors.background.primary');
  border-radius: 6px;
}

.battle-turn {
  font-size: 0.9rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.battle-status {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.status-fighting {
  background-color: v-bind('colors.brand.primary');
  color: white;
}

.status-victory {
  background-color: v-bind('colors.status.success');
  color: white;
}

.status-defeat {
  background-color: v-bind('colors.status.error');
  color: white;
}

/* 血条 */
.battle-hp {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hp-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hp-label {
  font-size: 0.8rem;
  color: v-bind('colors.text.primary');
  font-weight: 600;
}

.hp-bar {
  width: 100%;
  height: 12px;
  background-color: v-bind('colors.background.primary');
  border-radius: 6px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.player-hp {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.enemy-hp {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

/* 战斗日志 */
.battle-log {
  background-color: v-bind('colors.background.primary');
  border-radius: 6px;
  padding: 0.75rem;
}

.log-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
  margin-bottom: 0.5rem;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 120px;
  overflow-y: auto;
}

.log-item {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
  padding: 0.2rem 0;
}

/* 结算卡片 */
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-info {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.summary-label {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.summary-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.summary-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
}

/* 抽卡结果弹窗 */
.gacha-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
}

.overlay-content {
  background-color: v-bind('colors.background.content');
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.overlay-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: v-bind('colors.text.primary');
  margin: 0;
}

.cards-container {
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.card-image-wrapper {
  width: 100px;
  height: 100px;
  padding: 4px;
  border-radius: 12px;
  border-width: 3px;
  border-style: solid;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.card-name {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  color: v-bind('colors.text.primary');
}

.btn-confirm {
  background-color: v-bind('colors.gacha.confirm');
  color: #1a1a1a;
  padding: 0.8rem 2rem;
  font-size: 1rem;
}

.btn-confirm:not(:disabled):hover {
  background-color: v-bind('colors.gacha.confirmHover');
}

/* 稀有度颜色 */
.text-rarity-sp, .rarity-border-sp { color: v-bind('colors.rarity.sp'); border-color: v-bind('colors.rarity.sp'); }
.text-rarity-ssr, .rarity-border-ssr { color: v-bind('colors.rarity.ssr'); border-color: v-bind('colors.rarity.ssr'); }
.text-rarity-sr, .rarity-border-sr { color: v-bind('colors.rarity.sr'); border-color: v-bind('colors.rarity.sr'); }
.text-rarity-r, .rarity-border-r { color: v-bind('colors.rarity.r'); border-color: v-bind('colors.rarity.r'); }

/* 稀有度背景 */
.rarity-bg-sp { background-color: v-bind('colors.rarity.sp'); }
.rarity-bg-ssr { background-color: v-bind('colors.rarity.ssr'); }
.rarity-bg-sr { background-color: v-bind('colors.rarity.sr'); }
.rarity-bg-r { background-color: v-bind('colors.rarity.r'); }

/* 高亮动画 */
@keyframes highlight-flash-ssr {
  0%,100% { box-shadow: 0 0 10px 2px v-bind('colors.rarity.ssr'); transform: scale(1); }
  50% { box-shadow: 0 0 30px 10px v-bind('colors.rarity.ssr'); transform: scale(1.05); }
}

.highlight-rarity.rarity-border-ssr {
  animation: highlight-flash-ssr 0.5s ease-in-out;
}

/* 响应式布局 */
@media (min-width: 680px) {
  .battle-panels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 1rem 0.75rem 5rem;
  }

  .card {
    padding: 0.8rem 1rem;
  }

  .progress-item {
    min-width: 70px;
  }

  .action-buttons {
    gap: 0.4rem;
  }

  .btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }
}
</style>
