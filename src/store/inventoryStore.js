import { ref } from 'vue'

const STORAGE_KEY = 'inventory_tokens'

function loadTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (e) { void e }
}

export const tokens = ref(loadTokens()) // cardId -> count

export const addToken = (cardId, amount = 1) => {
  const a = Math.max(1, Math.floor(Number(amount) || 1))
  const cur = tokens.value.get(cardId) || 0
  tokens.value.set(cardId, cur + a)
  saveTokens(tokens.value)
}

export const getTokenCount = (cardId) => tokens.value.get(cardId) || 0
