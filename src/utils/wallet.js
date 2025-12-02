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

// Vouchers: test/dev build has effectively unlimited vouchers
function isTestMode() {
  try {
    return import.meta.env.MODE === 'development'
  } catch {
    return false
  }
}

export function getVouchers() {
  if (isTestMode()) return Number.MAX_SAFE_INTEGER
  return readNumber(STORAGE_KEYS.vouchers, 0)
}

export function setVouchers(value) {
  if (isTestMode()) return Number.MAX_SAFE_INTEGER
  return writeNumber(STORAGE_KEYS.vouchers, value)
}

export function addVoucher(amount) {
  if (isTestMode()) return Number.MAX_SAFE_INTEGER
  const current = getVouchers()
  return setVouchers(current + Math.max(0, Math.floor(Number(amount) || 0)))
}

export function consumeVoucher(amount) {
  if (isTestMode()) return true
  const a = Math.max(0, Math.floor(Number(amount) || 0))
  const current = getVouchers()
  if (current < a) return false
  setVouchers(current - a)
  return true
}

// Apply voucher to a purchase cost. Vouchers act as currency units.
export function applyVoucherToCost(cost) {
  const totalCost = Math.max(0, Math.floor(Number(cost) || 0))
  const vouchers = getVouchers()
  const used = Math.min(vouchers, totalCost)
  const finalCost = totalCost - used
  if (used > 0) consumeVoucher(used)
  return { finalCost, voucherUsed: used }
}

// pricing moved to config/commerce.js
