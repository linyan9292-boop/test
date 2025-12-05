const STORAGE_KEYS = {
  diamonds: 'wallet_diamonds',
  vouchers: 'wallet_vouchers',
}

function readNumber(key, defaultValue = 0) {
  try {
    const v = localStorage.getItem(key)
    if (v === null || v === undefined) return defaultValue
    const n = Number(v)
    return Number.isFinite(n) ? n : defaultValue
  } catch {
    return defaultValue
  }
}

function writeNumber(key, value) {
  try {
    const v = Math.max(0, Math.floor(Number(value) || 0))
    localStorage.setItem(key, String(v))
    return v
  } catch {
    return 0
  }
}

export function getDiamonds() {
  return readNumber(STORAGE_KEYS.diamonds, 0)
}

export function setDiamonds(value) {
  return writeNumber(STORAGE_KEYS.diamonds, value)
}

export function addDiamonds(amount) {
  const current = getDiamonds()
  return setDiamonds(current + Math.max(0, Math.floor(Number(amount) || 0)))
}

export function spendDiamonds(cost) {
  const c = Math.max(0, Math.floor(Number(cost) || 0))
  const current = getDiamonds()
  if (current < c) return false
  setDiamonds(current - c)
  return true
}


export function getVouchers() {
  return readNumber(STORAGE_KEYS.vouchers, 0)
}

export function setVouchers(value) {
  return writeNumber(STORAGE_KEYS.vouchers, value)
}

export function addVoucher(amount) {
  const current = getVouchers()
  return setVouchers(current + Math.max(0, Math.floor(Number(amount) || 0)))
}

export function consumeVoucher(amount) {
  const a = Math.max(0, Math.floor(Number(amount) || 0))
  const current = getVouchers()
  if (current < a) return false
  setVouchers(current - a)
  return true
}

// Apply voucher to a purchase cost. Non-destructive: does not change balances.
export function applyVoucherToCost(cost) {
  const totalCost = Math.max(0, Math.floor(Number(cost) || 0))
  const v = getVouchers()
  const used = Math.min(v, totalCost)
  const finalCost = totalCost - used
  return { finalCost, voucherUsed: used }
}

// pricing moved to config/commerce.js
