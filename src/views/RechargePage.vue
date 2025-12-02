<template>
  <div class="page-bg">
    <div class="page">
      <div class="header">
        <h1>钻石充值</h1>
        <div class="balances">
          <span>当前钻石：{{ diamonds }}</span>
          <span>代金券：{{ vouchersDisplay }}</span>
        </div>
      </div>

      <div class="bundle-grid card">
        <div v-for="b in bundles" :key="b.id" class="bundle">
          <h3>{{ b.name }}</h3>
          <p>可得：{{ b.diamonds }} 钻石</p>
          <p>价格：{{ b.price }} 代金券</p>
          <button @click="purchase(b)" class="buy-btn">充值</button>
        </div>
      </div>

      <div class="actions card">
        <router-link to="/voucher" class="link">看广告领取代金券</router-link>
        <router-link to="/chouka" class="link">返回抽卡</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { colors } from '@/styles/colors.js'
import { getDiamonds, addDiamonds, getVouchers, applyVoucherToCost } from '@/utils/wallet.js'

const diamonds = ref(getDiamonds())
const vouchers = ref(getVouchers())
const vouchersDisplay = ref(vouchers.value === Number.MAX_SAFE_INTEGER ? '∞' : String(vouchers.value))

const refresh = () => {
  diamonds.value = getDiamonds()
  vouchers.value = getVouchers()
  vouchersDisplay.value = vouchers.value === Number.MAX_SAFE_INTEGER ? '∞' : String(vouchers.value)
}

const bundles = ref([
  { id: 'b1', name: '小额礼包', diamonds: 60, price: 6 },
  { id: 'b2', name: '标准礼包', diamonds: 300, price: 30 },
  { id: 'b3', name: '豪华礼包', diamonds: 980, price: 98 },
  { id: 'b4', name: '至尊礼包', diamonds: 1980, price: 198 },
])

const purchase = (bundle) => {
  const { finalCost, voucherUsed } = applyVoucherToCost(bundle.price)
  if (finalCost > 0) {
    alert(`代金券不足，还需 ${finalCost}。请前往观看广告领取。`)
    return
  }
  addDiamonds(bundle.diamonds)
  alert(`充值成功，使用代金券 ${voucherUsed}，获得钻石 ${bundle.diamonds}`)
  refresh()
}
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
.card { background-color: v-bind('colors.background.content'); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); }
.header { display: flex; justify-content: space-between; align-items: center; }
.balances { display: flex; gap: 1rem; }
.bundle-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.bundle { background-color: v-bind('colors.background.primary'); border-radius: 8px; padding: 1rem; border: 1px solid v-bind('colors.border.primary'); }
.buy-btn { cursor: pointer; border: none; border-radius: 8px; padding: 0.6rem 1rem; font-weight: bold; color: white; background-color: v-bind('colors.brand.primary'); }
.buy-btn:hover { background-color: v-bind('colors.brand.hover'); }
.link { background-color: v-bind('colors.brand.primary'); text-decoration: none; color: white; padding: 0.6rem 1rem; border-radius: 8px; margin-right: 0.5rem; }
.link:hover { background-color: v-bind('colors.brand.hover'); }
</style>
