import { ref, computed } from 'vue'
import * as RARITY from '@/data/rarity.js'
import { addToken } from '@/store/inventoryStore.js'
import { getEquipmentBonus } from '@/store/inventoryStore.js'

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

// 队伍配置
const TEAM_KEY = 'game_team'
function loadTeam() {
  try {
    const raw = localStorage.getItem(TEAM_KEY)
    if (!raw) return [null, null, null, null]
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : [null, null, null, null]
  } catch { return [null, null, null, null] }
}
function saveTeam(value) {
  try { localStorage.setItem(TEAM_KEY, JSON.stringify(value)) } catch (e) { void e }
}
export const teamSlots = ref(loadTeam()) // 4个队伍槽位

export const setTeamSlot = (index, character) => {
  teamSlots.value[index] = character
  saveTeam(teamSlots.value)
}

export const clearTeamSlot = (index) => {
  teamSlots.value[index] = null
  saveTeam(teamSlots.value)
}

export const getTeamPower = () => {
  return teamSlots.value.reduce((sum, character) => {
    if (!character) return sum
    const basePower = cardPower(character)
    const equipmentBonus = getEquipmentBonus(character.id)
    const bonusPower = (equipmentBonus.atk * 10) + (equipmentBonus.def * 8) + (equipmentBonus.hp * 2) + (equipmentBonus.spd * 5)
    return sum + basePower + bonusPower
  }, 0)
}

export const resetRun = () => { deck.value = []; buffs.value = [] }

export const MAX_LEVEL = 100
export const EXP_CURVE = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]

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

export const getExpForLevel = (level) => {
  if (level <= 0) return 0
  if (level >= MAX_LEVEL) return Infinity
  const baseExp = EXP_CURVE[Math.min(level - 1, EXP_CURVE.length - 1)] || (level * 100)
  return Math.floor(baseExp * Math.pow(1.1, level - 10))
}

export const getExpToNextLevel = (card) => {
  const currentLevel = card.level || 0
  if (currentLevel >= MAX_LEVEL) return 0
  return getExpForLevel(currentLevel + 1) - (card.exp || 0)
}

export const grantGlobalExp = (amount) => {
  const inc = Math.max(0, Math.floor(Number(amount) || 0))
  deck.value.forEach((c) => {
    if ((c.level || 0) >= MAX_LEVEL) return
    c.exp = (c.exp || 0) + inc
    while (c.exp >= getExpForLevel((c.level || 0) + 1) && (c.level || 0) < MAX_LEVEL) {
      c.exp -= getExpForLevel((c.level || 0) + 1)
      c.level = (c.level || 0) + 1
    }
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
