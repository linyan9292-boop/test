<template>
  <div class="page-bg">
    <div class="page">
      <div class="header">
        <h1>获取代金券</h1>
        <div class="balances">
          <span>当前代金券：{{ vouchersDisplay }}</span>
        </div>
      </div>

      <div class="card">
        <p>通过观看广告可获得代金券，用于抵扣钻石充值礼包价格。</p>
        <button @click="startAd" class="primary-btn" :disabled="isPlayingAd">开始播放广告</button>
        <p v-if="isPlayingAd">广告播放中... {{ countdown }}s</p>
      </div>

      <div class="actions card">
        <router-link to="/recharge" class="link">前往充值</router-link>
        <router-link to="/chouka" class="link">返回抽卡</router-link>
        <button class="primary-btn" @click="spinWheel">免费转盘（剩余：{{ freeSpinsLeft }}）</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { colors } from '@/styles/colors.js'
import { vouchers, addVoucher, refreshWallet } from '@/store/walletStore.js'
import { FREE_WHEEL } from '@/config/commerce.js'

const vouchersDisplay = ref(vouchers.value === Number.MAX_SAFE_INTEGER ? '∞' : String(vouchers.value))
const isPlayingAd = ref(false)
const countdown = ref(0)
const WorkerUrl = ref('')

const resolveWorkerUrl = () => {
  const { protocol, hostname, port } = window.location
  WorkerUrl.value = port ? `${protocol}//${hostname}:8787` : `${protocol}//${hostname}`
}
resolveWorkerUrl()

const refresh = () => {
  refreshWallet()
  vouchersDisplay.value = vouchers.value === Number.MAX_SAFE_INTEGER ? '∞' : String(vouchers.value)
}

const freeSpinsLeft = ref(FREE_WHEEL.spinsPerDay)
const lastSpinDayKey = 'voucher_wheel_last_day'
const initSpins = () => {
  const today = new Date().toDateString()
  const last = localStorage.getItem(lastSpinDayKey)
  if (last !== today) {
    localStorage.setItem(lastSpinDayKey, today)
    freeSpinsLeft.value = FREE_WHEEL.spinsPerDay
  } else {
    const saved = localStorage.getItem('voucher_wheel_spins_left')
    freeSpinsLeft.value = saved ? Number(saved) : FREE_WHEEL.spinsPerDay
  }
}
initSpins()
const saveSpins = () => localStorage.setItem('voucher_wheel_spins_left', String(freeSpinsLeft.value))

const spinWheel = () => {
  if (freeSpinsLeft.value <= 0) { alert('今日免费次数已用完'); return }
  const gain = Math.floor(Math.random() * (FREE_WHEEL.maxVoucher - FREE_WHEEL.minVoucher + 1)) + FREE_WHEEL.minVoucher
  addVoucher(gain)
  freeSpinsLeft.value -= 1
  saveSpins()
  refresh()
  alert(`转盘奖励：代金券 +${gain}`)
}

const startAd = async () => {
  if (isPlayingAd.value) return
  isPlayingAd.value = true
  countdown.value = 3
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)

  if (WorkerUrl.value) {
    await fetch(`${WorkerUrl.value}/ads/start`).catch(() => {})
  }

  setTimeout(async () => {
    let ok = false
    if (WorkerUrl.value) {
      try {
        const res = await fetch(`${WorkerUrl.value}/ads/complete`, { method: 'POST' })
        const data = await res.json().catch(() => ({ success: true, voucher: 10 }))
        const amount = Number(data?.voucher) || 10
        addVoucher(amount)
        ok = true
      } catch {
        ok = false
      }
    }
    if (!ok) {
      addVoucher(10)
    }
    alert('领取成功，代金券 +10')
    refresh()
    isPlayingAd.value = false
  }, 3000)
}
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
.card { background-color: v-bind('colors.background.content'); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); }
.header { display: flex; justify-content: space-between; align-items: center; }
.balances { display: flex; gap: 1rem; }
.primary-btn { cursor: pointer; border: none; border-radius: 8px; padding: 0.6rem 1rem; font-weight: bold; color: white; background-color: v-bind('colors.brand.primary'); }
.primary-btn:hover { background-color: v-bind('colors.brand.hover'); }
.primary-btn:disabled { background-color: #555; cursor: not-allowed; }
.link { background-color: v-bind('colors.brand.primary'); text-decoration: none; color: white; padding: 0.6rem 1rem; border-radius: 8px; margin-right: 0.5rem; }
.link:hover { background-color: v-bind('colors.brand.hover'); }
</style>
