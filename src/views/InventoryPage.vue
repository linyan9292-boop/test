<template>
  <div class="page-bg">
    <div class="page">
      <h1>背包</h1>
      <div class="tokens card">
        <h2>卡牌信物</h2>
        <div class="token-list">
          <div v-for="t in tokenEntries" :key="t.id" class="token-item">
            <img :src="getCardImage(t.id)" :alt="getCardName(t.id)" class="token-image" />
            <div class="token-info">
              <div class="token-name">{{ getCardName(t.id) }}</div>
              <div class="token-count">x{{ t.count }}</div>
            </div>
          </div>
          <p v-if="tokenEntries.length === 0" class="empty">暂无信物</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { colors } from '@/styles/colors.js'
import { tokens } from '@/store/inventoryStore.js'
import { cardMap } from '@/data/cards'

const tokenEntries = computed(() => Array.from(tokens.value.entries()).map(([id, count]) => ({ id, count })))
const getCardName = (id) => cardMap.get(id)?.name || `卡牌 ${id}`
const getCardImage = (id) => cardMap.get(id)?.imageUrl || '/images/cards/1101.webp'
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
.card { background-color: v-bind('colors.background.content'); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); }
.token-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
.token-item { display: flex; gap: 0.75rem; align-items: center; background-color: v-bind('colors.background.primary'); padding: 0.75rem; border-radius: 8px; border: 1px solid v-bind('colors.border.primary'); }
.token-image { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
.token-name { font-weight: 600; }
.token-count { color: v-bind('colors.text.secondary'); }
.empty { color: v-bind('colors.text.secondary'); }
</style>
