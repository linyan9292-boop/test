<template>
  <div class="page-container">
    <div class="page-content">
      <!-- 页面标题 + 钱石 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">闯关模式</h1>
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

        <!-- 关卡特殊机制 -->
        <div v-if="currentStageConfig?.specialMechanic && currentStageConfig?.specialMechanic !== 'none'" class="mechanic-info">
          <div class="mechanic-title">特殊机制</div>
          <div class="mechanic-desc">{{ currentStageConfig.mechanicDescription }}</div>
        </div>

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
              <!-- 攻击特效 -->
              <div v-for="effect in attackEffects.filter(e => e.isPlayer)" :key="effect.id" class="attack-effect player-attack"></div>
              <!-- 伤害数字 -->
              <div v-for="damage in damageNumbers.filter(n => n.isPlayer)" :key="damage.id"
                   class="damage-number player-damage"
                   :style="{ left: damage.x + '%', top: damage.y + 'px' }">
                -{{ damage.value }}
              </div>
            </div>
            <div class="hp-section">
              <div class="hp-label">敌方 HP: {{ enemyHP }}</div>
              <div class="hp-bar">
                <div class="hp-fill enemy-hp" :style="{ width: (enemyHP / (enemyTeam.reduce((sum, e) => sum + (e.hp || 0), 0)) * 100) + '%' }"></div>
              </div>
              <!-- 攻击特效 -->
              <div v-for="effect in attackEffects.filter(e => !e.isPlayer)" :key="effect.id" class="attack-effect enemy-attack"></div>
              <!-- 伤害数字 -->
              <div v-for="damage in damageNumbers.filter(n => !n.isPlayer)" :key="damage.id"
                   class="damage-number enemy-damage"
                   :style="{ left: damage.x + '%', top: damage.y + 'px' }">
                -{{ damage.value }}
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

          <!-- 技能按钮区域 -->
          <div v-if="battleState === 'fighting'" class="skills-section">
            <div class="skills-title">技能</div>
            <div class="skills-grid">
              <div v-for="teamMember in teamSkills" :key="teamMember.character.id" class="character-skills">
                <div class="skill-character">{{ teamMember.character.name }}</div>
                <div class="skill-buttons">
                  <button
                    v-for="(skill, skillType) in teamMember.skills"
                    :key="skillType"
                    :class="['skill-btn', `skill-${skill.type}`, { 'cooldown': skillCooldowns[`${teamMember.character.id}_${skillType}`] > 0 }]"
                    @click="useSkill(teamMember.character, skillType)"
                    :disabled="skillCooldowns[`${teamMember.character.id}_${skillType}`] > 0"
                  >
                    <div class="skill-name">{{ skill.name }}</div>
                    <div class="skill-desc">{{ skill.description }}</div>
                    <div v-if="skillCooldowns[`${teamMember.character.id}_${skillType}`] > 0" class="skill-cooldown">
                      CD: {{ skillCooldowns[`${teamMember.character.id}_${skillType}`] }}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 技能特效显示 -->
          <div v-if="currentSkillEffect" class="skill-effect">
            <div class="skill-effect-text">{{ currentSkillEffect.character }} 使用了 {{ currentSkillEffect.name }}！</div>
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
import { getStageConfig } from '@/data/stages.js'
import { switchSceneMusic, playBattleSound } from '@/utils/audioManager.js'
import { getCharacterSkills } from '@/data/skills.js'

const route = useRoute()
const diamonds = walletDiamonds
const refreshDiamonds = () => { refreshWallet() }

const MAX_STAGE = 10
const stage = ref(1)
const power = computed(() => getTeamPower())
const currentStageConfig = computed(() => getStageConfig(stage.value))
const recommendPower = computed(() => currentStageConfig.value?.recommendPower || 80)

const enemyTeam = computed(() => {
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

// 动画状态
const damageNumbers = ref([])
const attackEffects = ref([])

// 技能系统
const skillCooldowns = ref({})
const battleBuffs = ref([])
const currentSkillEffect = ref(null)

// 获取队伍技能
const teamSkills = computed(() => {
  const team = teamSlots.value.filter(Boolean)
  return team.map(character => ({
    character,
    skills: getCharacterSkills(character.type || 'warrior')
  }))
})

// 添加伤害数字
const addDamageNumber = (damage, isPlayer = true) => {
  const id = Date.now() + Math.random()
  damageNumbers.value.push({
    id,
    value: damage,
    isPlayer,
    x: Math.random() * 60 + 20, // 随机位置
    y: 50
  })

  // 2秒后移除
  setTimeout(() => {
    damageNumbers.value = damageNumbers.value.filter(n => n.id !== id)
  }, 2000)
}

// 添加攻击特效
const addAttackEffect = (isPlayer = true) => {
  const id = Date.now() + Math.random()
  attackEffects.value.push({
    id,
    isPlayer,
    active: true
  })

  // 1秒后移除
  setTimeout(() => {
    attackEffects.value = attackEffects.value.filter(e => e.id !== id)
  }, 1000)
}

// 技能释放
const useSkill = (character, skillType) => {
  const skills = getCharacterSkills(character.type || 'warrior')
  const skill = skills[skillType]

  if (!skill) return

  // 检查冷却
  const cooldownKey = `${character.id}_${skillType}`
  if (skillCooldowns.value[cooldownKey] > 0) {
    addBattleLog(`技能冷却中，还需 ${skillCooldowns.value[cooldownKey]} 回合`)
    return
  }

  // 设置冷却
  if (skill.cooldown > 0) {
    skillCooldowns.value[cooldownKey] = skill.cooldown
  }

  // 显示技能特效
  currentSkillEffect.value = {
    name: skill.name,
    type: skill.type,
    character: character.name
  }

  setTimeout(() => {
    currentSkillEffect.value = null
  }, 1500)

  // 应用技能效果
  applySkillEffect(skill, character)

  addBattleLog(`${character.name} 使用了 ${skill.name}！`)
}

// 应用技能效果
const applySkillEffect = (skill, character) => {
  switch (skill.type) {
    case 'attack':
    case 'magic': {
      const damage = Math.floor((character.atk || 0) * skill.damageMultiplier)
      enemyHP.value = Math.max(0, enemyHP.value - damage)
      addDamageNumber(damage, true)
      playBattleSound('damage')

      // 应用特殊效果
      if (skill.effect === 'stun') {
        addBattleLog('敌人被眩晕了！')
      } else if (skill.effect === 'freeze') {
        addBattleLog('敌人被冻结了！')
      } else if (skill.effect === 'poison') {
        battleBuffs.value.push({
          type: 'poison',
          target: 'enemy',
          duration: skill.duration,
          value: Math.floor(damage * 0.3)
        })
        addBattleLog('敌人中毒了！')
      }
      break
    }

    case 'heal': {
      let heal = Math.floor(Math.abs((character.atk || 0) * skill.damageMultiplier))

      // 检查治疗削弱效果
      const hasHealingReduction = battleBuffs.value.some(buff =>
        buff.type === 'healing_reduction' && buff.target === 'player'
      )
      if (hasHealingReduction) {
        heal = Math.floor(heal * 0.5) // 治疗效果降低50%
        addBattleLog('治疗效果被削弱！')
      }

      playerHP.value = Math.min(playerHP.value + heal, teamSlots.value.filter(Boolean).reduce((sum, c) => sum + (c.hp || 0), 0))
      addDamageNumber(-heal, true) // 负数表示治疗
      playBattleSound('damage')

      if (skill.effect === 'def_boost') {
        battleBuffs.value.push({
          type: 'def_boost',
          target: 'player',
          duration: skill.duration,
          value: skill.value
        })
        addBattleLog('我方防御力提升！')
      }
      break
    }

    case 'buff':
      if (skill.effect === 'team_atk_boost') {
        battleBuffs.value.push({
          type: 'atk_boost',
          target: 'player',
          duration: skill.duration,
          value: skill.value
        })
        addBattleLog('我方攻击力提升！')
      }
      break
  }
}

// 更新冷却时间
const updateCooldowns = () => {
  Object.keys(skillCooldowns.value).forEach(key => {
    if (skillCooldowns.value[key] > 0) {
      skillCooldowns.value[key]--
    }
  })
}

// 更新Buff效果
const updateBuffs = () => {
  battleBuffs.value = battleBuffs.value.filter(buff => {
    buff.duration--

    // 应用持续伤害效果
    if (buff.type === 'poison' && buff.target === 'player') {
      const poisonDamage = buff.value
      playerHP.value = Math.max(0, playerHP.value - poisonDamage)
      addDamageNumber(poisonDamage, false)
      addBattleLog(`毒素伤害：${poisonDamage}`)
    }

    return buff.duration > 0
  })

  // 应用关卡特殊机制
  applyStageMechanic()
}

// 应用关卡特殊机制
const applyStageMechanic = () => {
  const stageConfig = currentStageConfig.value
  if (!stageConfig || !stageConfig.specialMechanic || stageConfig.specialMechanic === 'none') return

  switch (stageConfig.specialMechanic) {
    case 'poison':
      // 毒素伤害：每回合结束时造成少量伤害
      if (currentTurn.value > 0) {
        const poisonDamage = Math.floor(teamSlots.value.filter(Boolean).reduce((sum, c) => sum + (c.hp || 0), 0) * 0.05)
        playerHP.value = Math.max(0, playerHP.value - poisonDamage)
        addDamageNumber(poisonDamage, false)
        addBattleLog(`环境毒素伤害：${poisonDamage}`)
      }
      break

    case 'crystal_power':
      // 水晶力量：每3回合获得攻击力加成
      if (currentTurn.value % 3 === 0) {
        battleBuffs.value.push({
          type: 'atk_boost',
          target: 'player',
          duration: 2,
          value: 0.3
        })
        addBattleLog('水晶能量激活！攻击力提升30%')
      }
      break

    case 'burning':
      // 灼烧：造成额外火焰伤害，但自身也受到灼烧
      if (currentTurn.value > 0) {
        const burnDamage = Math.floor(enemyTeam.value.reduce((sum, e) => sum + (e.hp || 0), 0) * 0.08)
        enemyHP.value = Math.max(0, enemyHP.value - burnDamage)
        addDamageNumber(burnDamage, true)
        addBattleLog(`火焰灼烧：${burnDamage}`)

        const selfBurn = Math.floor(teamSlots.value.filter(Boolean).reduce((sum, c) => sum + (c.hp || 0), 0) * 0.03)
        playerHP.value = Math.max(0, playerHP.value - selfBurn)
        addDamageNumber(selfBurn, false)
        addBattleLog(`环境灼烧：${selfBurn}`)
      }
      break

    case 'freeze':
      // 冰冻：Boss每2回合冻结一名敌人
      if (stageConfig.isBoss && currentTurn.value % 2 === 0) {
        addBattleLog('Boss释放冰冻技能！')
        // 这里可以添加冻结效果的逻辑
      }
      break

    case 'wind_boost':
      // 风之加成：速度属性获得额外加成
      if (currentTurn.value === 1) {
        battleBuffs.value.push({
          type: 'spd_boost',
          target: 'player',
          duration: 999,
          value: 0.5
        })
        addBattleLog('风暴之力！速度提升50%')
      }
      break

    case 'healing_reduction':
      // 治疗削弱：治疗效果降低50%
      // 这个效果会在治疗技能中应用
      break

    case 'lightning':
      // 闪电：每回合有概率触发连锁闪电
      if (Math.random() < 0.3) {
        const lightningDamage = Math.floor(enemyTeam.value.reduce((sum, e) => sum + (e.atk || 0), 0) * 0.5)
        enemyHP.value = Math.max(0, enemyHP.value - lightningDamage)
        addDamageNumber(lightningDamage, true)
        addBattleLog(`连锁闪电：${lightningDamage}`)
      }
      break

    case 'dragon_rage':
      // 龙之怒：Boss血量低于50%时攻击力翻倍
      if (stageConfig.isBoss) {
        const maxEnemyHP = enemyTeam.value.reduce((sum, e) => sum + (e.hp || 0), 0)
        if (enemyHP.value < maxEnemyHP * 0.5) {
          battleBuffs.value.push({
            type: 'atk_boost',
            target: 'enemy',
            duration: 999,
            value: 1.0
          })
          addBattleLog('Boss进入狂暴状态！攻击力翻倍')
        }
      }
      break

    case 'chaos_mode':
      // 混沌模式：随机触发各种特殊效果
      if (Math.random() < 0.4) {
        const randomEffects = [
          () => {
            const chaosDamage = Math.floor(enemyTeam.value.reduce((sum, e) => sum + (e.hp || 0), 0) * 0.1)
            enemyHP.value = Math.max(0, enemyHP.value - chaosDamage)
            addDamageNumber(chaosDamage, true)
            addBattleLog(`混沌打击：${chaosDamage}`)
          },
          () => {
            const chaosHeal = Math.floor(teamSlots.value.filter(Boolean).reduce((sum, c) => sum + (c.hp || 0), 0) * 0.08)
            playerHP.value = Math.min(playerHP.value + chaosHeal, teamSlots.value.filter(Boolean).reduce((sum, c) => sum + (c.hp || 0), 0))
            addDamageNumber(-chaosHeal, true)
            addBattleLog(`混沌治疗：${chaosHeal}`)
          },
          () => {
            battleBuffs.value.push({
              type: 'atk_boost',
              target: 'player',
              duration: 1,
              value: 0.25
            })
            addBattleLog('混沌之力！攻击力临时提升')
          }
        ]

        const randomEffect = randomEffects[Math.floor(Math.random() * randomEffects.length)]
        randomEffect()
      }
      break
  }
}

// 初始化战斗
const initBattle = () => {
  battleState.value = 'fighting'
  currentTurn.value = 0
  battleLog.value = []

  // 切换到战斗音乐
  switchSceneMusic('roguelike')

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

  // 更新冷却和Buff
  updateCooldowns()
  updateBuffs()

  // 计算我方伤害
  const playerTeam = teamSlots.value.filter(Boolean)
  const playerATK = playerTeam.reduce((sum, c) => sum + (c.atk || 0), 0)
  const playerSPD = playerTeam.reduce((sum, c) => sum + (c.spd || 0), 0)

  // 计算敌方伤害
  const enemyATK = enemyTeam.value.reduce((sum, e) => sum + (e.atk || 0), 0)
  const enemyDEF = enemyTeam.value.reduce((sum, e) => sum + (e.def || 0), 0)
  const enemySPD = enemyTeam.value.reduce((sum, e) => sum + (e.spd || 0), 0)

  // 应用Buff加成
  let atkBoost = 1
  let defBoost = 1

  battleBuffs.value.forEach(buff => {
    if (buff.target === 'player') {
      if (buff.type === 'atk_boost') atkBoost += buff.value
      if (buff.type === 'def_boost') defBoost += buff.value
    }
  })

  // 自动释放技能
  const autoCastSkills = () => {
    playerTeam.forEach(character => {
      if (!character.skills) return
      
      character.skills.forEach(skill => {
        if (!skill || skillCooldowns.value[skill.name] > 0) return
        
        // 根据技能类型和冷却状态自动释放
        const shouldCast = Math.random() < (skill.chance || 0.3) // 30%概率释放技能
        
        if (shouldCast) {
          castSkill(character, skill)
          skillCooldowns.value[skill.name] = (skill.cooldown || 3)
        }
      })
    })
  }

  // 伤害计算
  let playerDamage = Math.max(1, Math.floor(playerATK * 0.8 * atkBoost - enemyDEF * 0.3))
  let enemyDamage = Math.max(1, Math.floor(enemyATK * 0.7 - playerTeam.reduce((sum, c) => sum + (c.def || 0), 0) * 0.3 * defBoost))

  // 速度加成
  if (playerSPD > enemySPD) {
    playerDamage = Math.floor(playerDamage * 1.2)
  }

  // 添加攻击特效
  addAttackEffect(true) // 我方攻击
  playBattleSound('attack') // 播放攻击音效
  
  // 自动释放技能
  setTimeout(() => {
    autoCastSkills()
  }, 200)

  setTimeout(() => {
    addAttackEffect(false) // 敌方反击
    playBattleSound('attack') // 播放攻击音效
  }, 500)

  // 应用伤害
  setTimeout(() => {
    enemyHP.value = Math.max(0, enemyHP.value - playerDamage)
    addDamageNumber(playerDamage, true) // 显示我方伤害
    playBattleSound('damage') // 播放伤害音效
  }, 300)

  setTimeout(() => {
    playerHP.value = Math.max(0, playerHP.value - enemyDamage)
    addDamageNumber(enemyDamage, false) // 显示敌方伤害
    playBattleSound('damage') // 播放伤害音效
  }, 800)

  addBattleLog(`${turnInfo} - 我方造成 ${playerDamage} 点伤害`)
  addBattleLog(`${turnInfo} - 敌方造成 ${enemyDamage} 点伤害`)

  // 检查战斗结束
  setTimeout(() => {
    if (enemyHP.value <= 0) {
      battleState.value = 'victory'
      addBattleLog('战斗胜利！')
      playBattleSound('victory') // 播放胜利音效
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
      addBattleLog('战斗失败！')
      playBattleSound('defeat') // 播放失败音效
    } else {
      // 继续下一回合 - 自动战斗
      if (battleState.value === 'fighting') {
        setTimeout(() => {
          executeTurn()
        }, 2000) // 2秒后执行下一回合
      }
    }
  }, 1200)
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

/* 特殊机制 */
.mechanic-info {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.mechanic-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: v-bind('colors.brand.primary');
  margin-bottom: 0.25rem;
}

.mechanic-desc {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
  line-height: 1.4;
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
  position: relative;
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

/* 攻击特效 */
.attack-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  animation: attackPulse 1s ease-out;
  pointer-events: none;
}

.player-attack {
  background: radial-gradient(circle, rgba(34, 197, 94, 0.8), transparent);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
}

.enemy-attack {
  background: radial-gradient(circle, rgba(239, 68, 68, 0.8), transparent);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

@keyframes attackPulse {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* 伤害数字 */
.damage-number {
  position: absolute;
  font-size: 1.2rem;
  font-weight: bold;
  animation: damageFloat 2s ease-out forwards;
  pointer-events: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.player-damage {
  color: #ef4444;
}

.enemy-damage {
  color: #22c55e;
}

@keyframes damageFloat {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-60px);
    opacity: 0;
  }
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

/* 技能系统 */
.skills-section {
  margin-top: 1rem;
  background-color: v-bind('colors.background.primary');
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid v-bind('colors.border.primary');
}

.skills-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: v-bind('colors.brand.primary');
}

.skills-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.character-skills {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill-character {
  font-size: 0.8rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
  margin-bottom: 0.25rem;
}

.skill-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.skill-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.5rem;
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 6px;
  background-color: v-bind('colors.background.content');
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.skill-btn:hover:not(.cooldown) {
  border-color: v-bind('colors.brand.primary');
  transform: translateY(-1px);
}

.skill-btn.cooldown {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: v-bind('colors.background.disabled');
}

.skill-attack {
  border-left: 3px solid #ef4444;
}

.skill-magic {
  border-left: 3px solid #3b82f6;
}

.skill-heal {
  border-left: 3px solid #22c55e;
}

.skill-buff {
  border-left: 3px solid #f59e0b;
}

.skill-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
  margin-bottom: 0.25rem;
}

.skill-desc {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
  line-height: 1.3;
  margin-bottom: 0.25rem;
}

.skill-cooldown {
  font-size: 0.7rem;
  color: v-bind('colors.status.error');
  font-weight: 600;
}

/* 技能特效 */
.skill-effect {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}

.skill-effect-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: v-bind('colors.brand.primary');
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: skillEffectAnimation 1.5s ease-out forwards;
}

@keyframes skillEffectAnimation {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
