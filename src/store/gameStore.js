import { ref, computed } from 'vue'
import * as RARITY from '@/data/rarity.js'
import { addToken } from '@/store/inventoryStore.js'

export const maxSlots = 6
const DECK_KEY = 'game_deck'
function loadDeck() {
  try {
    const raw = localStorage.getItem(DECK_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}
function saveDeck(value) {
  try { localStorage.setItem(DECK_KEY, JSON.stringify(value)) } catch (e) { void e }
}
export const deck = ref(loadDeck()) // { id, name, rarity, level, exp, atk, def, hp, spd }
export const buffs = ref([]) // { id, name, effect: (card)=>multiplier }

export const resetRun = () => { deck.value = []; buffs.value = [] }

export const rarityBasePower = {
  [RARITY.SP]: 10,
  [RARITY.SSR]: 5,
  [RARITY.SR]: 2,
  [RARITY.R]: 1,
}

export const cardPower = (card) => {
  const base = rarityBasePower[card.rarity] || 1
  const levelBonus = Math.floor(card.level || 0)
  const mult = buffs.value.reduce((acc, b) => acc * (typeof b.effect === 'function' ? b.effect(card) : 1), 1)
  // 简化：基础+等级 + (攻击*0.5 + 防御*0.3 + 速度*0.2)/100
  const stats = (card.atk || 0) * 0.5 + (card.def || 0) * 0.3 + (card.spd || 0) * 0.2
  return Math.floor((base + levelBonus + stats / 100) * mult)
}

export const totalPower = computed(() => deck.value.reduce((sum, c) => sum + cardPower(c), 0))

export const grantGlobalExp = (amount) => {
  const inc = Math.max(0, Math.floor(Number(amount) || 0))
  deck.value.forEach((c) => {
    c.exp = (c.exp || 0) + inc
    while (c.exp >= 100) { c.exp -= 100; c.level = (c.level || 0) + 1 }
  })
}

export const addCardsToDeck = (cards) => {
  const statByRarity = (r) => {
    if (r === RARITY.SP) return { atk: 120, def: 90, hp: 1200, spd: 110 }
    if (r === RARITY.SSR) return { atk: 100, def: 80, hp: 1000, spd: 105 }
    if (r === RARITY.SR) return { atk: 80, def: 60, hp: 800, spd: 100 }
    return { atk: 60, def: 40, hp: 600, spd: 95 }
  }
  const withStats = cards.map(c => {
    const base = statByRarity(c.rarity)
    const level = c.level || 0
    return { ...c, level, exp: c.exp || 0, atk: base.atk + level * 5, def: base.def + level * 4, hp: base.hp + level * 30, spd: base.spd + Math.floor(level / 2) }
  })
  const normalized = withStats
  const sortByRarity = (a, b) => {
    const order = { [RARITY.SP]: 4, [RARITY.SSR]: 3, [RARITY.SR]: 2, [RARITY.R]: 1 }
    return (order[b.rarity] || 0) - (order[a.rarity] || 0)
  }
  const toAdd = [...normalized].sort(sortByRarity)
  for (const nc of toAdd) {
    const existsIdx = deck.value.findIndex(d => d.id === nc.id)
    if (existsIdx !== -1) {
      addToken(nc.id, 1)
      continue
    }
    if (deck.value.length < maxSlots) {
      deck.value.push(nc)
    } else {
      // replace weakest
      let weakestIdx = 0
      let weakestPower = cardPower(deck.value[0])
      for (let i = 1; i < deck.value.length; i++) {
        const p = cardPower(deck.value[i])
        if (p < weakestPower) { weakestPower = p; weakestIdx = i }
      }
      if (cardPower(nc) > weakestPower) {
        deck.value.splice(weakestIdx, 1, nc)
      }
    }
  }
  saveDeck(deck.value)
}

export const randomBuffChoices = () => {
  return [
    { id: 'buff_sp_15', name: '限定强化', effect: (c) => (c.rarity === RARITY.SP ? 1.15 : 1) },
    { id: 'buff_ssr_10', name: 'SSR强化', effect: (c) => (c.rarity === RARITY.SSR ? 1.10 : 1) },
    { id: 'buff_all_05', name: '全队鼓舞', effect: () => 1.05 },
  ]
}

export const addBuff = (buff) => { buffs.value.push(buff) }
