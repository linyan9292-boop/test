<template>
  <div id="app">
    <router-view />
    <FloatingHomeButton v-if="$route.path !== '/'" />
    <div class="bottom-nav">
      <router-link to="/game/zaodaoji" class="nav-item">闯关</router-link>
      <router-link to="/team" class="nav-item">队伍配置</router-link>
      <router-link to="/dungeon" class="nav-item">装备副本</router-link>
      <router-link to="/inventory" class="nav-item">背包</router-link>
      <router-link to="/chouka" class="nav-item">抽卡</router-link>
      <router-link to="/voucher" class="nav-item">代金券</router-link>
    </div>
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-card">
          <div class="loading-title">正在加载…</div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>
  <transition name="fade">
    <div v-if="showUpdateDialog" class="update-overlay">
      <div class="update-dialog">
        <!-- 添加一个标题和图标，让弹窗更醒目 -->
        <div class="dialog-header">
          <UpdateRotation theme="outline" size="32" fill="#333" />
          <h3 class="dialog-title">发现新版本！</h3>
        </div>

        <p class="dialog-content">网站已更新，点击“立即刷新”以体验最新功能，享受更流畅的浏览体验。</p>

        <button @click="confirmUpdate" class="update-button">立即刷新</button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'App',
}
</script>

<script setup>
import { watch, ref, onMounted } from 'vue'
import { UpdateRotation } from '@icon-park/vue-next';
import FloatingHomeButton from './components/FloatingHomeButton.vue';
import './styles/global.css';
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { colors } from '@/styles/colors.js'

const { needRefresh, updateServiceWorker } = useRegisterSW()
// 使用 watch 监听是否有新版本

const showUpdateDialog = ref(false)
const isLoading = ref(true)
const progress = ref(0)

watch(needRefresh, (newValue) => {
  if (newValue) {
    showUpdateDialog.value = true
  }
})

function confirmUpdate() {
  updateServiceWorker()
}

onMounted(() => {
  const timer = setInterval(() => {
    if (progress.value < 95) progress.value += 3
  }, 120)
  window.addEventListener('load', () => {
    progress.value = 100
    setTimeout(() => { isLoading.value = false; clearInterval(timer) }, 200)
  })
  setTimeout(() => { isLoading.value = false; clearInterval(timer) }, 2500)
})

</script>

<style scoped>
#app {
  text-align: center;
  color: v-bind('colors.text.primary');
  min-height: 100dvh;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background-color: v-bind('colors.background.content');
  border-top: 1px solid v-bind('colors.border.primary');
  padding: 0.4rem 0.4rem calc(0.4rem + env(safe-area-inset-bottom));
  z-index: 1000;
  gap: 0.25rem;
}

.nav-item {
  flex: 1;
  color: v-bind('colors.text.primary');
  text-decoration: none;
  padding: 0.35rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.nav-item.router-link-active {
  background-color: v-bind('colors.background.hover');
}

/* 覆盖整个屏幕并使背景变暗 */
.update-overlay {
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  /* 添加毛玻璃效果 */
}

/* 弹窗本体 */
.update-dialog {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  /* 添加一个细微的边框 */
  text-align: left;
  /* 弹窗内容左对齐更易读 */
  transform: scale(1);
  /* 初始状态为正常大小 */
}

/* 弹窗标题 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #2c3e50;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

/* 弹窗内容文本 */
.dialog-content {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

/* 更新按钮 */
.update-button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  width: 100%;
  /* 按钮横跨整个弹窗，操作更方便 */
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.update-button:hover {
  background-color: #36a473;
}

.update-button:active {
  transform: scale(0.98);
}

/* --- Vue Transition 动画 --- */
/* 进入和离开动画的持续时间 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.5, 0, 0.25, 1);
}

/* 定义进入动画的起始状态和离开动画的结束状态 */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 为弹窗主体添加入场动画 */
.fade-enter-active .update-dialog,
.fade-leave-active .update-dialog {
  transition: transform 0.3s cubic-bezier(0.5, 0, 0.25, 1);
}

.fade-enter-from .update-dialog,
.fade-leave-to .update-dialog {
  transform: scale(0.95);
}
</style>
.loading-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.loading-card { background: #111827; color: v-bind('colors.text.primary'); padding: 1rem 1.5rem; border-radius: 12px; width: 90%; max-width: 360px; border: 1px solid v-bind('colors.border.primary'); }
.loading-title { margin-bottom: 0.75rem; }
.progress-bar { height: 10px; background: v-bind('colors.background.primary'); border-radius: 8px; overflow: hidden; border: 1px solid v-bind('colors.border.primary'); }
.progress { height: 100%; background: linear-gradient(145deg, #6D28D9, #4C1D95); width: 0%; transition: width 0.2s ease; }
