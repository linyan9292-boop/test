<template>
  <div class="page-container">
    <div class="page-content">
      <h1 class="page-title">队伍配置</h1>

      <div class="card team-summary">
        <div class="summary-header">
          <div class="summary-main">
            <div class="summary-label">当前队伍战力</div>
            <div class="summary-value">{{ totalPower.toLocaleString() }}</div>
          </div>
          <button class="summary-btn" @click="autoOptimize">快速优化</button>
        </div>
        <div class="summary-tags">
          <span class="tag">均衡</span>
          <span class="tag">物理输出</span>
          <span class="tag">单体爆发</span>
        </div>
      </div>

      <div class="card team-grid">
        <h2 class="section-title">上阵队伍</h2>
        <div class="slot-grid">
          <div class="slot" v-for="(slot, index) in 4" :key="index" @click="openCharacterSelector(index)">
            <div v-if="teamSlots[index]" class="avatar-filled">
              <img :src="teamSlots[index].imageUrl || '/images/cards/1101.webp'" :alt="teamSlots[index].name" />
            </div>
            <div v-else class="avatar-empty"></div>
            <div class="slot-info">
              <div class="slot-title">位置 {{ index + 1 }}</div>
              <div class="slot-sub">{{ teamSlots[index] ? teamSlots[index].name : '点击选择角色' }}</div>
              <div v-if="teamSlots[index]" class="slot-stats">
                <div class="stat-breakdown">
                  <span class="base-power">基础: {{ cardPower(teamSlots[index]) }}</span>
                  <span class="equip-power">装备: {{ calculateCharacterEquipmentPower(teamSlots[index].id) }}</span>
                </div>
                <div class="level-info">
                  <span class="level">Lv.{{ teamSlots[index].level || 0 }}</span>
                  <div class="exp-bar">
                    <div class="exp-fill" :style="{ width: getExpProgress(teamSlots[index]) + '%' }"></div>
                  </div>
                  <span class="exp-text">{{ teamSlots[index].exp || 0 }}/{{ getExpToNextLevel(teamSlots[index]) }}</span>
                </div>
                <div class="total-power">总战力: {{ calculatePower(teamSlots[index]) }}</div>
              </div>
              <div v-if="teamSlots[index]" class="slot-equipment">
                <div class="equipment-items">
                  <div v-for="item in getCharacterEquipmentItems(teamSlots[index].id)" :key="item.id" class="equipment-item">
                    <div class="equipment-info">
                      <span class="item-name" :class="`quality-${item.rarity}`">{{ item.name }}</span>
                      <span class="item-power">+{{ calculateEquipmentPower(item) }}战力</span>
                    </div>
                    <button class="btn-unequip" @click.stop="unequipItemFromCharacter(item.id)">×</button>
                  </div>
                  <button v-if="getCharacterEquipmentItems(teamSlots[index].id).length < 3" class="btn-add-equipment" @click.stop="openEquipmentSelector(index)">+装备</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bench-list">
        <h2 class="section-title">候补与备选</h2>
        <div class="bench-grid">
          <div v-for="character in availableCharacters" :key="character.id"
               class="bench-item"
               @click="addToTeam(character)">
            <img :src="character.imageUrl || '/images/cards/1101.webp'" :alt="character.name" class="bench-avatar" />
            <div class="bench-info">
              <div class="bench-name">{{ character.name }}</div>
              <div class="bench-power">战力 {{ calculatePower(character) }}</div>
            </div>
          </div>
        </div>
        <p v-if="availableCharacters.length === 0" class="hint">暂无可用角色，请先通过抽卡获取角色</p>
      </div>

      <!-- 角色选择弹窗 -->
      <div v-if="showSelector" class="selector-overlay" @click="closeSelector">
        <div class="selector-content" @click.stop>
          <h3 class="selector-title">选择角色 - 位置 {{ selectorIndex + 1 }}</h3>
          <div class="selector-grid">
            <div v-for="character in selectableCharacters" :key="character.id"
                 class="selector-item"
                 @click="selectCharacter(character)">
              <img :src="character.imageUrl || '/images/cards/1101.webp'" :alt="character.name" class="selector-avatar" />
              <div class="selector-info">
                <div class="selector-name">{{ character.name }}</div>
                <div class="selector-power">战力 {{ calculatePower(character) }}</div>
              </div>
            </div>
          </div>
          <button class="btn btn-remove" @click.stop="removeFromTeam" v-if="teamSlots[selectorIndex]">移除角色</button>
        </div>
      </div>
    </div>

    <!-- 装备选择弹窗 -->
    <div v-if="showEquipmentSelector" class="modal-overlay" @click="closeEquipmentSelector">
      <div class="modal-content" @click.stop>
        <h3 class="selector-title">选择装备 - 位置 {{ equipmentSelectorIndex + 1 }}</h3>
        <div class="equipment-selector-grid">
          <div v-for="item in getAvailableEquipment()" :key="item.id"
               class="equipment-selector-item"
               @click="equipItemToCharacter(item.id)">
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
          </div>
          <p v-if="getAvailableEquipment().length === 0" class="empty-equipment">暂无可用装备，请先通过装备副本获取</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { colors } from '@/styles/colors.js'
import { deck, teamSlots, setTeamSlot, clearTeamSlot, cardPower } from '@/store/gameStore.js'
import { equipment, equipItem, unequipItem, getCharacterEquipment } from '@/store/inventoryStore.js'

// 获取牌组数据
// const { deck } = useDeck()

// 队伍配置状态
const showSelector = ref(false)
const selectorIndex = ref(0)
const showEquipmentSelector = ref(false)
const equipmentSelectorIndex = ref(0)

// 计算总战力
const totalPower = computed(() => {
  return teamSlots.value.reduce((sum, character) => {
    return sum + (character ? calculatePower(character) : 0)
  }, 0)
})

// 计算单个角色战力（包含装备）
const calculatePower = (character) => {
  const basePower = cardPower(character)
  const equipmentPower = calculateCharacterEquipmentPower(character.id)
  return basePower + equipmentPower
}

// 可用角色（不在队伍中的角色）
const availableCharacters = computed(() => {
  const teamIds = teamSlots.value.filter(Boolean).map(c => c.id)
  return deck.value.filter(character => !teamIds.includes(character.id))
})

// 可选择角色（用于弹窗）
const selectableCharacters = computed(() => {
  return deck.value
})

// 打开角色选择器
const openCharacterSelector = (index) => {
  selectorIndex.value = index
  showSelector.value = true
}

// 关闭选择器
const closeSelector = () => {
  showSelector.value = false
}

// 选择角色
const selectCharacter = (character) => {
  setTeamSlot(selectorIndex.value, character)
  closeSelector()
}

// 从队伍中移除角色
const removeFromTeam = () => {
  clearTeamSlot(selectorIndex.value)
  closeSelector()
}

// 添加到队伍（从候补区）
const addToTeam = (character) => {
  const emptyIndex = teamSlots.value.findIndex(slot => slot === null)
  if (emptyIndex !== -1) {
    setTeamSlot(emptyIndex, character)
  } else {
    alert('队伍已满，请先移除一个角色')
  }
}

// 快速优化
const autoOptimize = () => {
  // 按战力排序所有角色
  const sortedCharacters = [...deck.value].sort((a, b) => calculatePower(b) - calculatePower(a))

  // 填充队伍槽位
  for (let i = 0; i < 4 && i < sortedCharacters.length; i++) {
    setTeamSlot(i, sortedCharacters[i])
  }

  // 自动装备战力最高的装备
  const unequippedByType = {}
  equipment.value.filter(e => !e.equipped).forEach(e => {
    if (!unequippedByType[e.type]) unequippedByType[e.type] = []
    unequippedByType[e.type].push(e)
  })

  // 为每个角色装备最强装备
  for (let i = 0; i < 4 && teamSlots.value[i]; i++) {
    const character = teamSlots.value[i]
    Object.values(unequippedByType).forEach(items => {
      if (items.length > 0) {
        const best = items.sort((a, b) => (b.atk + b.def + b.hp + b.spd) - (a.atk + a.def + a.hp + a.spd))[0]
        equipItem(best.id, character.id)
        items.splice(items.indexOf(best), 1)
      }
    })
  }

  alert('队伍已优化完成！')
}

// 计算装备战力
const calculateEquipmentPower = (item) => {
  return (item.atk * 10) + (item.def * 8) + (item.hp * 2) + (item.spd * 5)
}

// 计算角色装备总战力
const calculateCharacterEquipmentPower = (characterId) => {
  const equipmentItems = getCharacterEquipment(characterId)
  return equipmentItems.reduce((sum, item) => sum + calculateEquipmentPower(item), 0)
}

// 获取角色装备
const getCharacterEquipmentItems = (characterId) => {
  return getCharacterEquipment(characterId)
}

// 获取可用装备（未装备的）
const getAvailableEquipment = () => {
  return equipment.value.filter(item => !item.equipped)
}

// 经验相关函数
const getExpProgress = (character) => {
  const currentLevel = character.level || 0
  if (currentLevel >= MAX_LEVEL) return 100
  const currentExp = character.exp || 0
  const nextLevelExp = getExpForLevel(currentLevel + 1)
  const currentLevelExp = getExpForLevel(currentLevel)
  return ((currentExp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100
}

// 装备物品
const equipItemToCharacter = (equipmentId) => {
  const character = teamSlots.value[equipmentSelectorIndex.value]
  if (character) {
    equipItem(equipmentId, character.id)
    showEquipmentSelector.value = false
  }
}

// 卸下装备
const unequipItemFromCharacter = (equipmentId) => {
  unequipItem(equipmentId)
}

// 打开装备选择器
const openEquipmentSelector = (index) => {
  equipmentSelectorIndex.value = index
  showEquipmentSelector.value = true
}

// 关闭装备选择器
const closeEquipmentSelector = () => {
  showEquipmentSelector.value = false
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
  background-color: v-bind('colors.background.primary');
  min-height: 100vh;
  padding: 2rem 1rem 5rem;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
  color: v-bind('colors.text.primary');
  display: grid;
  gap: 1.2rem;
}

.page-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

/* 通用卡片 */
.card {
  background-color: v-bind('colors.background.content');
  padding: 1rem 1.2rem;
  border-radius: 12px;
  border: 1px solid v-bind('colors.border.primary');
}

/* 队伍摘要 */
.team-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.summary-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.summary-label {
  font-size: 0.8rem;
  color: v-bind('colors.text.secondary');
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: v-bind('colors.text.primary');
}

.summary-btn {
  background-color: v-bind('colors.brand.primary');
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.summary-btn:hover {
  background-color: v-bind('colors.brand.hover');
}

.summary-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

/* 队伍网格 */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: v-bind('colors.text.primary');
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.slot {
  background-color: v-bind('colors.background.primary');
  border: 2px solid v-bind('colors.border.primary');
  border-radius: 10px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slot:hover {
  border-color: v-bind('colors.brand.primary');
  transform: translateY(-2px);
}

.avatar-filled {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.avatar-filled img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-empty {
  width: 60px;
  height: 60px;
  background-color: v-bind('colors.background.content');
  border: 2px dashed v-bind('colors.border.primary');
  border-radius: 8px;
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slot-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.slot-sub {
  font-size: 0.75rem;
  color: v-bind('colors.text.secondary');
}

/* 候补列表 */
.bench-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.bench-item {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bench-item:hover {
  border-color: v-bind('colors.brand.primary');
  transform: translateY(-1px);
}

.bench-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.bench-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.bench-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.bench-power {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
}

.hint {
  color: v-bind('colors.text.secondary');
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
  padding: 1rem;
}

/* 角色选择弹窗 */
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
}

.selector-content {
  background-color: v-bind('colors.background.content');
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selector-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: v-bind('colors.text.primary');
}

.selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.selector-item {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selector-item:hover {
  border-color: v-bind('colors.brand.primary');
  transform: translateY(-1px);
}

.selector-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.selector-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.selector-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.selector-power {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
}

.btn {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-remove {
  background-color: v-bind('colors.status.error');
  color: white;
}

.btn-remove:hover {
  background-color: #dc2626;
}

/* 装备相关样式 */
.slot-stats {
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: v-bind('colors.background.primary');
  border-radius: 4px;
  font-size: 0.7rem;
}

.stat-breakdown {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.base-power {
  color: v-bind('colors.text.secondary');
}

.equip-power {
  color: v-bind('colors.brand.primary');
}

.total-power {
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

.slot-equipment {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid v-bind('colors.border.primary');
}

.equipment-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: v-bind('colors.background.content');
  padding: 0.2rem 0.3rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

.item-name {
  color: v-bind('colors.text.primary');
  white-space: nowrap;
}

.equipment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
}

.equipment-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-name {
  font-weight: 600;
}

.item-power {
  color: v-bind('colors.brand.primary');
  font-weight: 600;
}

.btn-unequip {
  background: none;
  border: none;
  color: v-bind('colors.status.error');
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-unequip:hover {
  background-color: rgba(220, 38, 38, 0.1);
}

.btn-add-equipment {
  background: none;
  border: 1px dashed v-bind('colors.border.primary');
  color: v-bind('colors.text.secondary');
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-add-equipment:hover {
  border-color: v-bind('colors.brand.primary');
  color: v-bind('colors.brand.primary');
}

.equipment-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
}

.equipment-selector-item {
  background-color: v-bind('colors.background.primary');
  border: 1px solid v-bind('colors.border.primary');
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.equipment-selector-item:hover {
  border-color: v-bind('colors.brand.primary');
  transform: translateY(-1px);
}

.equipment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.equipment-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('colors.text.primary');
}

/* 装备品质颜色 */
.quality-common {
  color: v-bind('colors.rarity.n');
}

.quality-rare {
  color: v-bind('colors.rarity.r');
}

.quality-epic {
  color: v-bind('colors.rarity.sr');
}

.quality-legendary {
  color: v-bind('colors.rarity.ssr');
}

.quality-mythic {
  color: v-bind('colors.rarity.sp');
}

.equipment-type {
  font-size: 0.7rem;
  color: v-bind('colors.text.secondary');
}

.equipment-stats {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.stat {
  font-size: 0.65rem;
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
  background-color: v-bind('colors.background.content');
  color: v-bind('colors.text.secondary');
}

.empty-equipment {
  color: v-bind('colors.text.secondary');
  font-size: 0.8rem;
  text-align: center;
  margin: 2rem 0;
}

/* 卡牌动画效果 */
.bench-item {
  transition: all 0.3s ease;
  cursor: pointer;
}

.bench-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.bench-item:active {
  transform: translateY(-2px);
}

.bench-avatar {
  transition: transform 0.3s ease;
}

.bench-item:hover .bench-avatar {
  transform: scale(1.05);
}

/* 经验条样式 */
.level-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
}

.level {
  font-size: 0.7rem;
  font-weight: bold;
  color: v-bind('colors.text.primary');
  min-width: 2rem;
}

.exp-bar {
  flex: 1;
  height: 4px;
  background-color: v-bind('colors.background.content');
  border-radius: 2px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, v-bind('colors.primary'), v-bind('colors.accent'));
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 0.6rem;
  color: v-bind('colors.text.secondary');
  min-width: 3rem;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .page-container {
    padding: 1rem 0.75rem 5rem;
  }

  .slot-grid {
    grid-template-columns: 1fr;
  }

  .bench-grid,
  .selector-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
