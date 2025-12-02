import { ref } from 'vue'

export const tokens = ref(new Map()) // cardId -> count

export const addToken = (cardId, amount = 1) => {
  const a = Math.max(1, Math.floor(Number(amount) || 1))
  const cur = tokens.value.get(cardId) || 0
  tokens.value.set(cardId, cur + a)
}

export const getTokenCount = (cardId) => tokens.value.get(cardId) || 0
