<template>
  <div class="page-bg">
    <div class="page">
      <div class="header">
        <h1>获取代金券</h1>
        <div class="balances">
          <span>当前代金券：{{ vouchersDisplay }}</span>
        </div>
      </div>

      <div class="card wheel-card">
        <h2 class="wheel-title">每日免费转盘</h2>
        <div class="wheel" :style="{ transform: `rotate(${rotation}deg)` }">
          <div class="wheel-inner">
            <span class="wheel-text">{{ spinResultText }}</span>
          </div>
          <div class="wheel-pointer"></div>
        </div>
        <div class="wheel-actions">
          <button class="primary-btn large" @click="spinWheel">开始抽取（剩余：{{ freeSpinsLeft }}）</button>
        </div>
      </div>

      <div class="card ad-card">
        <h2 class="ad-title">观看广告领取代金券</h2>
        <p class="ad-desc">用于抵扣钻石充值礼包价格</p>
        <div class="ad-actions">
          <button @click="startAd" class="primary-btn large" :disabled="isPlayingAd">{{ isPlayingAd ? `播放中... ${countdown}s` : '开始播放广告' }}</button>
        </div>
      </div>

      <div class="actions card">
        <router-link to="/recharge" class="link primary">前往充值</router-link>
        <router-link to="/chouka" class="link primary">返回抽卡</router-link>
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

const vouchersDisplay = ref(String(vouchers.value))
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

const rotation = ref(0)
const spinResultText = ref('')
const TIERS = FREE_WHEEL.tiers
const sectorAngles = TIERS.map(() => 360 / TIERS.length)
const spinWheel = () => {
  if (freeSpinsLeft.value <= 0) { alert('今日免费次数已用完'); return }
  const index = Math.floor(Math.random() * TIERS.length)
  const stopAngle = 360 * 3 + sectorAngles.slice(0, index).reduce((a, b) => a + b, 0) + sectorAngles[index] / 2
  rotation.value = stopAngle
  spinResultText.value = `${TIERS[index]}`
  setTimeout(() => {
    const gain = TIERS[index]
    addVoucher(gain)
    freeSpinsLeft.value -= 1
    saveSpins()
    refresh()
    alert(`转盘奖励：代金券 +${gain}`)
  }, 1600)
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
      addVoucher(100)
    }
    alert('领取成功，代金券 +100')
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
.primary-btn { cursor: pointer; border: none; border-radius: 10px; padding: 0.8rem 1.2rem; font-weight: bold; color: white; background: linear-gradient(145deg, #6D28D9, #4C1D95); box-shadow: 0 6px 16px rgba(109,40,217,0.4); }
.primary-btn.large { padding: 1rem 1.6rem; font-size: 1.1rem; }
.primary-btn:hover { background-color: v-bind('colors.brand.hover'); }
.primary-btn:disabled { background-color: #555; cursor: not-allowed; }
.link { text-decoration: none; color: white; padding: 0.6rem 1rem; border-radius: 10px; margin-right: 0.5rem; }
.link.primary { background: linear-gradient(145deg, #10B981, #059669); box-shadow: 0 6px 16px rgba(16,185,129,0.35); }
.link.primary:hover { filter: brightness(1.1); }

.wheel-card { display: grid; gap: 1rem; text-align: center; }
.wheel-title { margin: 0; font-size: 1.2rem; }
.wheel { position: relative; width: 220px; height: 220px; margin: 0 auto; border-radius: 50%; background: conic-gradient(#F59E0B 0 72deg, #FDE68A 72deg 144deg, #F59E0B 144deg 216deg, #FDE68A 216deg 288deg, #F59E0B 288deg 360deg); box-shadow: inset 0 0 20px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transition: transform 1.5s cubic-bezier(0.25, 0.1, 0.25, 1); }
.wheel-inner { width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, #1f2937 0%, #111827 60%); display: flex; align-items: center; justify-content: center; color: v-bind('colors.text.highlight'); font-weight: bold; }
.wheel-pointer { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 20px solid #EF4444; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
.wheel-actions { display: flex; justify-content: center; }

.ad-card { text-align: center; }
.ad-title { margin: 0 0 0.5rem 0; }
.ad-desc { color: v-bind('colors.text.secondary'); margin-bottom: 1rem; }
.ad-actions { display: flex; justify-content: center; }
</style>
