<template>
  <div class="page-bg">
    <div class="page">
      <h1>背包</h1>

      <div class="tokens card">
        <h2>卡牌信物</h2>
        <div class="token-list">
          <div v-for="t in tokenEntries" :key="t.id" class="token-item clickable" @click="showTokenDetail(t)">
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

        <!-- 装备合成 -->
        <div class="crafting-section">
          <h3>装备合成</h3>
          <div class="crafting-grid">
            <div v-for="item in availableForCrafting" :key="item.id" class="crafting-item">
              <div class="crafting-info">
                <div class="crafting-name">{{ item.name }}</div>
                <div class="crafting-cost">需要: {{ item.name }} x3</div>
              </div>
              <button class="btn-craft" @click="craftEquipment(item)">合成</button>
            </div>
          </div>
        </div>

        <div class="equipment-list">
          <div v-for="item in equipment" :key="item.id" class="equipment-item clickable" @click="showEquipmentDetail(item)">
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

  <!-- 详情弹窗 -->
  <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ detailItem.name || getCardName(detailItem.id) }}</h3>
        <button class="close-btn" @click="closeDetailModal">×</button>
      </div>
      <div class="modal-body">
        <img v-if="detailItem.imageUrl" :src="detailItem.imageUrl" :alt="detailItem.name" class="detail-image" />
        <img v-else-if="detailItem.id" :src="getCardImage(detailItem.id)" :alt="getCardName(detailItem.id)" class="detail-image" />
        
        <div class="detail-info">
          <div v-if="detailItem.type" class="detail-type">{{ detailItem.type }} · {{ detailItem.rarity }}</div>
          <div v-if="detailItem.count" class="detail-count">数量: {{ detailItem.count }}</div>
          
          <div v-if="detailItem.atk || detailItem.def || detailItem.hp || detailItem.spd" class="detail-stats">
            <div v-if="detailItem.atk > 0" class="stat">攻击力: +{{ detailItem.atk }}</div>
            <div v-if="detailItem.def > 0" class="stat">防御力: +{{ detailItem.def }}</div>
            <div v-if="detailItem.hp > 0" class="stat">生命值: +{{ detailItem.hp }}</div>
            <div v-if="detailItem.spd > 0" class="stat">速度: +{{ detailItem.spd }}</div>
          </div>
          
          <div v-if="detailItem.equipped !== undefined" class="detail-status">
            <span v-if="detailItem.equipped" class="equipped-tag">已装备</span>
            <span v-else class="unequipped-tag">未装备</span>
          </div>
          
          <div v-if="detailItem.description" class="detail-description">
            {{ detailItem.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { colors } from '@/styles/colors.js'
import { tokens, equipment } from '@/store/inventoryStore.js'
import { cardMap } from '@/data/cards'
import { deck, cardPower } from '@/store/gameStore.js'

// 详情弹窗状态
const showDetailModal = ref(false)
const detailItem = ref({})

const tokenEntries = computed(() => Array.from(tokens.value.entries()).map(([id, count]) => ({ id, count })))
const getCardName = (id) => cardMap.get(id)?.name || `卡牌 ${id}`
const getCardImage = (id) => cardMap.get(id)?.imageUrl || '/images/cards/1101.webp'
const calculateCharacterPower = (character) => cardPower(character)

// 显示详情
const showTokenDetail = (token) => {
  const card = cardMap.get(token.id)
  detailItem.value = {
    id: token.id,
    name: card?.name,
    count: token.count,
    description: card?.description || '卡牌信物，可用于合成装备'
  }
  showDetailModal.value = true
}

const showEquipmentDetail = (item) => {
  detailItem.value = { ...item }
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  detailItem.value = {}
}

// 装备合成功能
const availableForCrafting = computed(() => {
  const itemCounts = {}
  equipment.value.forEach(item => {
    if (!item.equipped) {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + 1
    }
  })

  return Object.entries(itemCounts)
    .filter(([, count]) => count >= 3)
    .map(([itemName]) => equipment.value.find(item => item.name === itemName))
    .filter(Boolean)
})

const craftEquipment = (baseItem) => {
  const sameItems = equipment.value.filter(item =>
    item.name === baseItem.name && !item.equipped
  )

  if (sameItems.length >= 3) {
    // 移除3个基础装备
    const itemsToRemove = sameItems.slice(0, 3)
    itemsToRemove.forEach(item => {
      const index = equipment.value.indexOf(item)
      equipment.value.splice(index, 1)
    })

    // 创建升级装备
    const enhancedItem = {
      ...baseItem,
      id: Date.now(),
      name: `${baseItem.name}+`,
      rarity: baseItem.rarity === '普通' ? '精良' : baseItem.rarity === '精良' ? '稀有' : '史诗',
      atk: Math.floor((baseItem.atk || 0) * 1.5),
      def: Math.floor((baseItem.def || 0) * 1.5),
      hp: Math.floor((baseItem.hp || 0) * 1.5),
      spd: Math.floor((baseItem.spd || 0) * 1.5),
      equipped: false
    }

    equipment.value.push(enhancedItem)

    // 显示合成成功提示
    alert(`合成成功！获得 ${enhancedItem.name}`)
  } else {
    alert('需要3个相同的未装备物品才能合成')
  }
}
</script>

<style scoped>
.page-bg { background-color: v-bind('colors.background.primary'); min-height: 100vh; padding: 2rem 1rem; }
.page { max-width: 900px; margin: 0 auto; color: v-bind('colors.text.primary'); display: grid; gap: 1.5rem; }
h1 { font-size: 1.3rem; font-weight: 700; margin: 0; }
.card { background-color: v-bind('colors.background.content'); padding: 1rem 1.2rem; border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); }
h2 { font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0; }

/* 卡牌信物 */
.token-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
.token-item { background-color: v-bind('colors.background.primary'); border: 1px solid v-bind('colors.border.primary'); border-radius: 8px; padding: 0.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.token-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px v-bind('colors.shadow.primary'); }
.token-image { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; }
.token-info { text-align: center; }
.token-name { font-size: 0.8rem; font-weight: 600; color: v-bind('colors.text.primary'); }
.token-count { font-size: 0.75rem; color: v-bind('colors.brand.primary'); }

/* 装备合成 */
.crafting-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: v-bind('colors.background.primary');
  border-radius: 8px;
  border: 1px solid v-bind('colors.border.primary');
}

.crafting-section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: v-bind('colors.brand.primary');
}

.crafting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.crafting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: v-bind('colors.background.content');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 6px;
}

.crafting-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.crafting-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.crafting-cost {
  font-size: 0.75rem;
  color: v-bind('colors.text.secondary');
}

.btn-craft {
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  background-color: v-bind('colors.brand.primary');
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-craft:hover {
  background-color: v-bind('colors.brand.hover');
}

/* 装备 */
.equipment-list { display: flex; flex-direction: column; gap: 0.75rem; }
.equipment-item { background-color: v-bind('colors.background.primary'); border: 1px solid v-bind('colors.border.primary'); border-radius: 8px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.equipment-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px v-bind('colors.shadow.primary'); }
.equipment-info { display: flex; flex-direction: column; gap: 0.25rem; }
.equipment-name { font-size: 0.9rem; font-weight: 600; color: v-bind('colors.text.primary'); }
.equipment-type { font-size: 0.75rem; color: v-bind('colors.text.secondary'); }
.equipment-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.stat { font-size: 0.7rem; padding: 0.1rem 0.3rem; border-radius: 4px; background-color: v-bind('colors.background.content'); color: v-bind('colors.text.secondary'); }
.equipment-status { display: flex; align-items: center; }
.equipped-tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background-color: v-bind('colors.status.success'); color: white; }
.unequipped-tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background-color: v-bind('colors.background.content'); color: v-bind('colors.text.secondary'); }
.empty { color: v-bind('colors.text.secondary'); font-size: 0.8rem; margin: 0; text-align: center; padding: 2rem; }

/* 详情弹窗 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background-color: v-bind('colors.background.content'); border-radius: 12px; border: 1px solid v-bind('colors.border.primary'); max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid v-bind('colors.border.primary'); }
.modal-header h3 { margin: 0; font-size: 1.1rem; color: v-bind('colors.text.primary'); }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: v-bind('colors.text.secondary'); padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.close-btn:hover { color: v-bind('colors.text.primary'); }
.modal-body { padding: 1.5rem; }
.detail-image { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin: 0 auto 1rem; display: block; }
.detail-info { text-align: center; }
.detail-type { font-size: 0.9rem; color: v-bind('colors.text.secondary'); margin-bottom: 0.5rem; }
.detail-count { font-size: 0.9rem; color: v-bind('colors.brand.primary'); margin-bottom: 0.5rem; }
.detail-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1rem 0; }
.detail-stats .stat { font-size: 0.8rem; padding: 0.3rem 0.5rem; border-radius: 6px; background-color: v-bind('colors.background.primary'); color: v-bind('colors.text.primary'); }
.detail-status { margin: 0.5rem 0; }
.detail-description { font-size: 0.9rem; color: v-bind('colors.text.secondary'); line-height: 1.5; margin-top: 1rem; }

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
