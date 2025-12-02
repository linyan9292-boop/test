<template>
  <div class="page-bg">
    <div class="page">
      <h1>队伍配置</h1>
      <p>配置卡牌的强化与装备。功能建设中。</p>
    </div>
  </div>
</template>

<script setup>
import { colors } from '@/styles/colors.js'
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
</style>
