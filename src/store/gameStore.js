import { ref, computed } from 'vue'
import * as RARITY from '@/data/rarity.js'

export const maxSlots = 6
export const deck = ref([]) // { id, name, rarity, level, exp }
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
  return Math.floor((base + levelBonus) * mult)
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
  const normalized = cards.map(c => ({ ...c, level: c.level || 0, exp: c.exp || 0 }))
  const sortByRarity = (a, b) => {
    const order = { [RARITY.SP]: 4, [RARITY.SSR]: 3, [RARITY.SR]: 2, [RARITY.R]: 1 }
    return (order[b.rarity] || 0) - (order[a.rarity] || 0)
  }
  const toAdd = [...normalized].sort(sortByRarity)
  for (const nc of toAdd) {
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
}

export const randomBuffChoices = () => {
  return [
    { id: 'buff_sp_15', name: '限定强化', effect: (c) => (c.rarity === RARITY.SP ? 1.15 : 1) },
    { id: 'buff_ssr_10', name: 'SSR强化', effect: (c) => (c.rarity === RARITY.SSR ? 1.10 : 1) },
    { id: 'buff_all_05', name: '全队鼓舞', effect: () => 1.05 },
  ]
}

export const addBuff = (buff) => { buffs.value.push(buff) }
