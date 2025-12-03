<template>
  <div class="page-container">
    <div class="page-content">
      <router-link to="/inventory" class="btn-back">← 返回</router-link>

      <div v-if="character" class="character-detail">
        <div class="character-header">
          <img :src="character.imageUrl || '/images/cards/1101.webp'" :alt="character.name" class="character-avatar" />
          <div class="character-info">
            <h1 class="character-name">{{ character.name }}</h1>
            <div class="character-rarity" :class="`rarity-${character.rarity.toLowerCase()}`">{{ character.rarity }}</div>
            <div class="character-level">Lv {{ character.level || 0 }}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">攻击</span>
            <span class="stat-value">{{ character.atk || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">防御</span>
            <span class="stat-value">{{ character.def || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">生命</span>
            <span class="stat-value">{{ character.hp || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">速度</span>
            <span class="stat-value">{{ character.spd || 0 }}</span>
          </div>
        </div>

        <div class="exp-section">
          <h2>经验进度</h2>
          <div class="exp-bar">
            <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
          </div>
          <div class="exp-text">{{ character.exp || 0 }} / {{ nextLevelExp }}</div>
        </div>

        <div class="equipment-section">
          <h2>装备</h2>
          <div v-if="characterEquipment.length > 0" class="equipment-list">
            <div v-for="item in characterEquipment" :key="item.id" class="equipment-card">
              <div class="equipment-name">{{ item.name }}</div>
              <div class="equipment-type">{{ item.type }}</div>
              <div class="equipment-bonus">
                <span v-if="item.atk > 0">+{{ item.atk }}攻</span>
                <span v-if="item.def > 0">+{{ item.def }}防</span>
                <span v-if="item.hp > 0">+{{ item.hp }}血</span>
                <span v-if="item.spd > 0">+{{ item.spd }}速</span>
              </div>
            </div>
          </div>
          <p v-else class="empty">暂无装备</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { colors } from '@/styles/colors.js'
import { deck } from '@/store/gameStore.js'
import { getCharacterEquipment } from '@/store/inventoryStore.js'

const route = useRoute()
const characterId = route.params.id

const character = computed(() => deck.value.find(c => c.id === characterId))
const characterEquipment = computed(() => character.value ? getCharacterEquipment(character.value.id) : [])
const nextLevelExp = 100
const expPercent = computed(() => character.value ? Math.min(100, ((character.value.exp || 0) / nextLevelExp) * 100) : 0)
</script>

<style scoped>
.page-container {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem 5rem;
}

.page-content {
  max-width: 600px;
  margin: 0 auto;
  color: v-bind('colors.text.primary');
}

.btn-back {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  color: v-bind('colors.text.primary');
  text-decoration: none;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: v-bind('colors.brand.primary');
}

.character-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.character-header {
  display: flex;
  gap: 1rem;
  background-color: v-bind('colors.background.content');
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

.character-avatar {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.character-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.character-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.character-rarity {
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  width: fit-content;
  font-weight: 600;
}

.rarity-sp { background-color: #fbbf24; color: #000; }
.rarity-ssr { background-color: #f87171; color: #fff; }
.rarity-sr { background-color: #a78bfa; color: #fff; }
.rarity-r { background-color: #60a5fa; color: #fff; }

.character-level {
  font-size: 0.9rem;
  color: v-bind('colors.text.secondary');
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-card {
  background-color: v-bind('colors.background.content');
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: v-bind('colors.brand.primary');
}

.exp-section {
  background-color: v-bind('colors.background.content');
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
}

.exp-section h2 {
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
}

.exp-bar {
  width: 100%;
  height: 8px;
  background-color: v-bind('colors.background.primary');
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 0.75rem;
  color: v-bind('colors.text.secondary');
}

.equipment-section {
  background-color: v-bind('colors.background.content');
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
}

.equipment-section h2 {
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.equipment-card {
  background-color: v-bind('colors.background.primary');
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid v-bind('colors.border.primary');
}

.equipment-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.equipment-type {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
}

.equipment-bonus {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.equipment-bonus span {
  font-size: 0.65rem;
  padding: 0.1rem 0.25rem;
  background-color: v-bind('colors.background.content');
  border-radius: 3px;
  color: v-bind('colors.brand.primary');
}

.empty {
  color: v-bind('colors.text.secondary');
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
  padding: 1rem;
}

@media (max-width: 480px) {
  .page-container {
    padding: 1rem 0.75rem 5rem;
  }

  .character-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .character-avatar {
    width: 100px;
    height: 100px;
  }
}
</style>
