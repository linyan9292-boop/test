import { ref } from 'vue'
import { getDiamonds as _getD, setDiamonds as _setD, addDiamonds as _addD, spendDiamonds as _spendD, getVouchers as _getV, setVouchers as _setV, addVoucher as _addV, applyVoucherToCost as _applyV, consumeVoucher as _consumeV } from '@/utils/wallet.js'
import { DEFAULT_VOUCHERS } from '@/config/commerce.js'

export const diamonds = ref(_getD())
export const vouchers = ref(_getV())

export const refreshWallet = () => {
  diamonds.value = _getD()
  vouchers.value = _getV()
}

const initVoucherBaseline = () => {
  try {
    const key = 'wallet_voucher_init_done'
    const done = localStorage.getItem(key)
    const current = _getV()
    if (!done && current < DEFAULT_VOUCHERS) {
      _setV(DEFAULT_VOUCHERS)
      localStorage.setItem(key, '1')
    }
    vouchers.value = _getV()
  } catch {
    // ignore
  }
}
initVoucherBaseline()

export const setDiamonds = (v) => { _setD(v); diamonds.value = _getD() }
export const addDiamonds = (a) => { _addD(a); diamonds.value = _getD() }
export const spendDiamonds = (c) => { const ok = _spendD(c); diamonds.value = _getD(); return ok }

export const setVouchers = (v) => { _setV(v); vouchers.value = _getV() }
export const addVoucher = (a) => { _addV(a); vouchers.value = _getV() }
export const applyVoucherToCost = (cost) => _applyV(cost)
export const consumeVoucher = (amount) => _consumeV(amount)

window.addEventListener('storage', (e) => {
  if (e.key === 'wallet_diamonds' || e.key === 'wallet_vouchers') {
    refreshWallet()
  }
})
