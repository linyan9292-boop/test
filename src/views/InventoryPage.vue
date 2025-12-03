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

      <div class="equipment card">
        <h2>装备</h2>
        <div class="equipment-list">
          <div v-for="item in equipment" :key="item.id" class="equipment-item">
            <div class="equipment-info">
              <div class="equipment-name">{{ item.name }}</div>
              <div class="equipment-type">{{ item.type }} · {{ item.rarity }}</div>
              <div class="equipment-stats">
                <span v-if="item.atk > 0" class="stat">攻击+{{ item.atk }}</span>
                <span v-if="item.def > 0" class="stat">防御+{{ item.def }}</span>
                <span v-if="item.hp > 0" class="stat">生命+{{ item.hp }}</span>
                <span v-if="item.spd > 0" class="stat">速度+{{ item.spd }}</span>
              </div>
            </div>
            <div class="equipment-status">
              <span v-if="item.equipped" class="equipped-tag">已装备</span>
              <span v-else class="unequipped-tag">未装备</span>
            </div>
          </div>
          <p v-if="equipment.length === 0" class="empty">暂无装备</p>
        </div>
      </div>

      <div class="characters card">
        <h2>角色列表</h2>
        <div class="character-list">
          <router-link v-for="character in deck" :key="character.id" :to="`/character/${character.id}`" class="character-item">
            <img :src="character.imageUrl || '/images/cards/1101.webp'" :alt="character.name" class="character-avatar" />
            <div class="character-info">
              <div class="character-name">{{ character.name }}</div>
              <div class="character-level">Lv {{ character.level || 0 }}</div>
              <div class="character-power">战力 {{ calculateCharacterPower(character) }}</div>
            </div>
          </router-link>
          <p v-if="deck.length === 0" class="empty">暂无角色</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { colors } from '@/styles/colors.js'
import { tokens, equipment } from '@/store/inventoryStore.js'
import { cardMap } from '@/data/cards'
import { deck, cardPower } from '@/store/gameStore.js'

const tokenEntries = computed(() => Array.from(tokens.value.entries()).map(([id, count]) => ({ id, count })))
const getCardName = (id) => cardMap.get(id)?.name || `卡牌 ${id}`
const getCardImage = (id) => cardMap.get(id)?.imageUrl || '/images/cards/1101.webp'
const calculateCharacterPower = (character) => cardPower(character)
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
h1 { font-size: 1.3rem; font-weight: 700; margin: 0; }
.card { background-color: v-bind('colors.background.content'); padding: 1rem 1.2rem; border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); }
h2 { font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0; }

/* 卡牌信物 */
.token-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
.token-item { background-color: v-bind('colors.background.primary'); border: 1px solid v-bind('colors.border.primary'); border-radius: 8px; padding: 0.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.token-image { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; }
.token-info { text-align: center; }
.token-name { font-size: 0.8rem; font-weight: 600; color: v-bind('colors.text.primary'); }
.token-count { font-size: 0.75rem; color: v-bind('colors.brand.primary'); }

/* 装备 */
.equipment-list { display: flex; flex-direction: column; gap: 0.75rem; }
.equipment-item { background-color: v-bind('colors.background.primary'); border: 1px solid v-bind('colors.border.primary'); border-radius: 8px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
.equipment-info { display: flex; flex-direction: column; gap: 0.25rem; }
.equipment-name { font-size: 0.9rem; font-weight: 600; color: v-bind('colors.text.primary'); }
.equipment-type { font-size: 0.75rem; color: v-bind('colors.text.secondary'); }
.equipment-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.stat { font-size: 0.7rem; padding: 0.1rem 0.3rem; border-radius: 4px; background-color: v-bind('colors.background.content'); color: v-bind('colors.text.secondary'); }
.equipment-status { display: flex; align-items: center; }
.equipped-tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background-color: v-bind('colors.status.success'); color: white; }
.unequipped-tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background-color: v-bind('colors.background.content'); color: v-bind('colors.text.secondary'); }
.empty { color: v-bind('colors.text.secondary'); font-size: 0.8rem; margin: 0; text-align: center; padding: 2rem; }

/* 角色列表 */
.character-list { display: flex; flex-direction: column; gap: 0.75rem; }
.character-item { display: flex; gap: 0.75rem; padding: 0.75rem; background-color: v-bind('colors.background.primary'); border: 1px solid v-bind('colors.border.primary'); border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.2s ease; }
.character-item:hover { border-color: v-bind('colors.brand.primary'); transform: translateY(-1px); }
.character-avatar { width: 50px; height: 50px; border-radius: 6px; object-fit: cover; }
.character-info { display: flex; flex-direction: column; gap: 0.25rem; }
.character-name { font-size: 0.85rem; font-weight: 600; }
.character-level { font-size: 0.75rem; color: v-bind('colors.text.secondary'); }
.character-power { font-size: 0.75rem; color: v-bind('colors.brand.primary'); }

@media (max-width: 480px) {
  .page-bg { padding: 1rem 0.75rem; }
  .token-list { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
  .equipment-item { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
