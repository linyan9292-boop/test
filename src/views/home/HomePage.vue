<template>
  <div class="background">
    <div class="home-container">
      <h1 class="title">盲盒派对</h1>

      <div class="button-group">
        <router-link to="/game/animalparty" class="btn daoyan"><span>🎮 闯关</span></router-link>
        <router-link to="/team" class="btn chouka"><span>🛡️ 队伍配置</span></router-link>
        <router-link to="/dungeon" class="btn chouka"><span>⚔️ 装备副本</span></router-link>
        <router-link to="/inventory" class="btn chouka"><span>🎒 背包</span></router-link>
        <router-link to="chouka" class="btn chouka"><span>✨ 抽卡</span></router-link>
        <router-link to="voucher" class="btn chouka"><span>🎟️ 代金券</span></router-link>
      </div>


    </div>
  </div>
</template>

<script setup>
import { colors } from '@/styles/colors.js';


// 创建一个 ref 保存 'beforeinstallprompt' 事件


// 设置一个监听器来捕获 'beforeinstallprompt' 事件


// --- 开发中按钮控制逻辑 ---


const colorTextPrimary = colors.text.primary;
</script>

<style scoped>
.background {
  position: relative;
  min-height: 100dvh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/homepage_bg.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.2;
  z-index: 1;
}

.home-container {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 2rem;
  background-color: rgba(26, 27, 32, 0.8);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  max-width: min(100vw, 800px);
  min-width: 0;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  color: v-bind(colorTextPrimary);
  margin-top: 1rem;
  margin-bottom: 2rem;
}



.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 600px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  min-height: 60px;
}

.btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.chouka {
  background: linear-gradient(145deg, #8B5CF6, #6D28D9);
}


.daoyan {
  background: linear-gradient(145deg, #10B981, #059669);
}

/* --- 开发中功能的按钮 --- */



</style>
