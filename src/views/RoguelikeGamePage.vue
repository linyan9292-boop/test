<template>
  <div class="page-bg">
    <div class="page">
      <div class="header">
        <div class="title">
          <h1>抽卡闯关</h1>
          <h2>{{ currentPool ? currentPool.name : '加载卡池中...' }}</h2>
        </div>
        <div class="wallet">
          <span>钻石：{{ diamonds }}</span>
          <router-link to="/recharge" class="link">去充值</router-link>
        </div>
      </div>

      <div class="run-stats card">
        <div class="stat"><span>关卡</span><strong>{{ stage }}/{{ MAX_STAGE }}</strong></div>
        <div class="stat"><span>当前战力</span><strong>{{ power }}</strong></div>
        <div class="stat"><span>推荐战力</span><strong>{{ recommendPower }}</strong></div>
      </div>

      <div v-if="!currentPool" class="card">卡池加载中或不存在...</div>

      <div v-else class="controls card">
        <div class="up-select" v-if="isSelectableUpPool">
          <h3>限定UP选择</h3>
          <div class="up-grid">
            <div v-for="card in upCardDetails" :key="card.id"
              :class="['up-item', `rarity-border-${card.rarity.toLowerCase()}`, { 'selected': selectedUpCard === card.id }]"
              @click="selectUpCard(card.id)">
              <img :src="card.imageUrl" :alt="card.name" />
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn" @click="doTenPull" :disabled="isAnimating">十连抽（{{ PRICES.tenPull }} 钻）</button>
          <button class="btn alt" @click="fight" :disabled="isAnimating">挑战关卡</button>
          <button class="btn" @click="openBuffPanel" :disabled="isAnimating">选择事件/Buff</button>
          <router-link to="/chouka" class="link">返回抽卡主页</router-link>
        </div>
      </div>

      <div v-if="showBuffPanel" class="card">
        <h3>事件选择：请选择一个Buff</h3>
        <div class="up-grid">
          <button v-for="b in chooseBuffs" :key="b.id" class="btn" @click="pickBuff(b)">{{ b.name }}</button>
        </div>
      </div>

      <div class="deck card">
        <h3>当前牌组（累计）</h3>
        <div class="deck-list">
          <span v-for="(c, i) in deck" :key="c.id + '_' + i" :class="`text-rarity-${c.rarity.toLowerCase()}`">{{ c.name }}</span>
          <p v-if="deck.length === 0" class="empty">尚未抽取任何角色</p>
        </div>
      </div>

      <div class="enemy card">
        <h3>敌人信息</h3>
        <div class="enemy-stats">
          <div><span>敌方战力</span><strong>{{ enemyPower }}</strong></div>
        </div>
        <div class="deck-list">
          <span v-for="(e, i) in enemyTeam" :key="'enemy_'+e.id + '_' + i" :class="`text-rarity-${e.rarity.toLowerCase()}`">{{ e.name }} Lv{{ e.level }}</span>
        </div>
      </div>

      <div v-if="showSummary" class="card">
        <h3>结算面板</h3>
        <p>总战力：{{ power }}</p>
        <p>通关关卡：{{ MAX_STAGE }}</p>
        <div class="deck-list">
          <span v-for="(c, i) in deck" :key="'sum_'+c.id + '_' + i" :class="`text-rarity-${c.rarity.toLowerCase()}`">{{ c.name }} Lv{{ c.level || 0 }}</span>
        </div>
        <button class="btn" @click="() => { showSummary = false; resetRun() }">再来一次</button>
      </div>

      <div v-if="showGachaResultOverlay" class="gacha-result-overlay">
        <div class="overlay-content">
          <h2 class="overlay-title">恭喜获得</h2>
          <div class="pulled-cards-container" ref="cardsContainerRef">
            <transition-group name="card-reveal" tag="div" class="pulled-cards-grid">
              <div v-for="(card, index) in displayedCards" :key="card.id + '_' + index"
                :class="['card-item', `rarity-bg-${card.rarity.toLowerCase()}`]">
                <div :class="['card-image-wrapper', `rarity-border-${card.rarity.toLowerCase()}`, { 'highlight-rarity': isHighlightRarity(card.rarity) }]">
                  <img :src="card.imageUrl || '/images/cards/1101.webp'" :alt="card.name" class="card-image">
                </div>
                <p class="card-name">{{ card.name }}</p>
              </div>
            </transition-group>
          </div>
          <button @click="confirmGachaResult" class="confirm-button" :disabled="isAnimating">{{ isAnimating ? '...' : '确定' }}</button>
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
import { deck, totalPower, addCardsToDeck, randomBuffChoices, addBuff, resetRun, grantGlobalExp } from '@/store/gameStore.js'

const route = useRoute()
const diamonds = walletDiamonds
const refreshDiamonds = () => { refreshWallet() }

const MAX_STAGE = 5
const difficulty = [80, 160, 240, 360, 480]
const stage = ref(1)
const power = totalPower
const recommendPower = computed(() => difficulty[stage.value - 1])

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

const teamSpeed = computed(() => deck.value.reduce((s, c) => s + (c.spd || 0), 0))
const fight = () => {
  const need = difficulty[stage.value - 1]
  let ok = power.value >= need
  if (!ok && power.value >= need * 0.9) {
    const bonusChance = Math.min(30, Math.floor(teamSpeed.value / 50))
    ok = Math.random() * 100 < bonusChance
  }
  if (ok) {
    alert(`挑战成功！通过第 ${stage.value} 关。`)
    if (stage.value < MAX_STAGE) {
      stage.value++
    } else {
      alert('通关！恭喜完成本次闯关！')
      showSummary.value = true
    }
  } else {
    alert(`挑战失败，至少需要战力 ${need}。请继续抽卡提升战力。`)
  }
}

const chooseBuffs = ref([])
const showBuffPanel = ref(false)
const openBuffPanel = () => { chooseBuffs.value = randomBuffChoices(); showBuffPanel.value = true }
const pickBuff = (buff) => { addBuff(buff); showBuffPanel.value = false }
const showSummary = ref(false)
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
.card { background-color: v-bind('colors.background.content'); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); }
.header { display: flex; justify-content: space-between; align-items: center; }
.title h1, .title h2 { margin: 0; }
.wallet { display: flex; gap: 0.75rem; align-items: center; }
.link { background-color: v-bind('colors.brand.primary'); text-decoration: none; color: white; padding: 0.4rem 0.8rem; border-radius: 6px; }
.link:hover { background-color: v-bind('colors.brand.hover'); }
.run-stats { display: flex; gap: 1.5rem; justify-content: space-around; text-align: center; }
.stat span { color: v-bind('colors.text.secondary'); margin-right: 0.5rem; }
.controls .actions { display: flex; gap: 0.75rem; align-items: center; }
.btn { cursor: pointer; border: none; border-radius: 8px; padding: 0.8rem 1.2rem; font-weight: bold; color: white; background-color: v-bind('colors.brand.primary'); }
.btn:hover { background-color: v-bind('colors.brand.hover'); }
.btn { padding: 0.6rem 0.9rem; font-size: 0.95rem; }
.btn.alt { background-color: v-bind('colors.gacha.confirm'); color: #1a1a1a; }
.up-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
.up-item { cursor: pointer; padding: 4px; border-radius: 12px; border: 4px solid transparent; }
.up-item img { width: 80px; height: 80px; border-radius: 8px; }
.deck-list { display: flex; gap: 0.6rem 1rem; flex-wrap: wrap; }
.empty { color: v-bind('colors.text.secondary'); }
.enemy-stats { display: flex; gap: 1.5rem; }

/* 结果叠加层复用样式 */
.gacha-result-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #000; background-image: url('/images/gacha_bg.webp'); background-position: center; background-size: cover; background-repeat: no-repeat; display: flex; justify-content: center; align-items: center; z-index: 1000; color: white; padding: 1rem; box-sizing: border-box; overflow: hidden; }
.gacha-result-overlay::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.2); z-index: 1; }
.overlay-content { position: relative; z-index: 2; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
.overlay-title { color: v-bind('colors.text.highlight'); font-size: 2.2em; margin-bottom: 1rem; }
.pulled-cards-container { width: 100%; max-width: 90vw; max-height: 70vh; overflow-y: auto; padding: 1rem; margin-top: auto; margin-bottom: auto; }
.pulled-cards-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5rem; }
.card-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.card-image-wrapper { width: 120px; height: 120px; padding: 5px; border-radius: 12px; border-width: 4px; border-style: solid; position: relative; }
.card-image { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.card-name { font-weight: bold; font-size: 1rem; white-space: nowrap; }
.confirm-button { padding: 1rem 4rem; margin-top: auto; font-size: 1.2em; background-color: v-bind('colors.gacha.confirm'); color: #1a1a1a; border: none; min-width: 120px; }
.confirm-button:hover:not(:disabled) { background-color: v-bind('colors.gacha.confirmHover'); }
.confirm-button:disabled { cursor: wait; }

/* 稀有度颜色复用 */
.text-rarity-sp, .rarity-border-sp { color: v-bind('colors.rarity.sp'); border-color: v-bind('colors.rarity.sp'); }
.text-rarity-ssr, .rarity-border-ssr { color: v-bind('colors.rarity.ssr'); border-color: v-bind('colors.rarity.ssr'); }
.text-rarity-sr, .rarity-border-sr { color: v-bind('colors.rarity.sr'); border-color: v-bind('colors.rarity.sr'); }
.text-rarity-r, .rarity-border-r { color: v-bind('colors.rarity.r'); border-color: v-bind('colors.rarity.r'); }

/* 简化动画 */
@keyframes highlight-flash-ssr { 0%,100%{ box-shadow: 0 0 10px 2px v-bind('colors.rarity.ssr'); transform: scale(1);} 50%{ box-shadow: 0 0 30px 10px v-bind('colors.rarity.ssr'); transform: scale(1.1);} }
.highlight-rarity.rarity-border-ssr { animation: highlight-flash-ssr 0.5s ease-in-out; }
</style>
