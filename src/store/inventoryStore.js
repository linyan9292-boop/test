import { ref } from 'vue'

const TOKENS_KEY = 'inventory_tokens'
const EQUIPMENT_KEY = 'inventory_equipment'

function loadTokens() {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    if (!raw) return new Map()
    const obj = JSON.parse(raw)
    const m = new Map()
    Object.entries(obj).forEach(([k, v]) => { m.set(k, Number(v) || 0) })
    return m
  } catch {
    return new Map()
  }
}

function saveTokens(map) {
  try {
    const obj = {}
    for (const [k, v] of map.entries()) obj[k] = v
    localStorage.setItem(TOKENS_KEY, JSON.stringify(obj))
  } catch (e) { void e }
}

function loadEquipment() {
  try {
    const raw = localStorage.getItem(EQUIPMENT_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveEquipment(equipment) {
  try {
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(equipment))
  } catch (e) { void e }
}

export const tokens = ref(loadTokens()) // cardId -> count
export const equipment = ref(loadEquipment()) // 装备数组

export const addToken = (cardId, amount = 1) => {
  const a = Math.max(1, Math.floor(Number(amount) || 1))
  const cur = tokens.value.get(cardId) || 0
  tokens.value.set(cardId, cur + a)
  saveTokens(tokens.value)
}

export const getTokenCount = (cardId) => tokens.value.get(cardId) || 0

export const addEquipment = (item) => {
  const equipmentItem = {
    id: Date.now() + Math.random(),
    name: item.name,
    type: item.type || '装备',
    rarity: item.rarity || '普通',
    power: item.power || 100,
    atk: item.atk || 0,
    def: item.def || 0,
    hp: item.hp || 0,
    spd: item.spd || 0,
    equipped: false,
    characterId: null
  }
  equipment.value.push(equipmentItem)
  saveEquipment(equipment.value)
}

export const equipItem = (equipmentId, characterId) => {
  const item = equipment.value.find(e => e.id === equipmentId)
  if (item) {
    // 先卸下该角色的同类型装备
    equipment.value.forEach(e => {
      if (e.characterId === characterId && e.type === item.type) {
        e.equipped = false
        e.characterId = null
      }
    })

    // 装备新物品
    item.equipped = true
    item.characterId = characterId
    saveEquipment(equipment.value)

    // 强制更新以触发响应式
    equipment.value = [...equipment.value]
  }
}

export const unequipItem = (equipmentId) => {
  const item = equipment.value.find(e => e.id === equipmentId)
  if (item) {
    item.equipped = false
    item.characterId = null
    saveEquipment(equipment.value)

    // 强制更新以触发响应式
    equipment.value = [...equipment.value]
  }
}

export const getCharacterEquipment = (characterId) => {
  return equipment.value.filter(e => e.characterId === characterId && e.equipped)
}

export const getEquipmentBonus = (characterId) => {
  const equipped = getCharacterEquipment(characterId)
  return equipped.reduce((bonus, item) => {
    return {
      atk: bonus.atk + (item.atk || 0),
      def: bonus.def + (item.def || 0),
      hp: bonus.hp + (item.hp || 0),
      spd: bonus.spd + (item.spd || 0)
    }
  }, { atk: 0, def: 0, hp: 0, spd: 0 })
}
