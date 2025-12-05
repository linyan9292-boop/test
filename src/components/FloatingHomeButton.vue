<template>
  <div class="floating-wrapper">
    <button class="floating-home-button" @click="goToHome" aria-label="返回主页">
      <Home theme="filled" size="24" fill="#fff" />
    </button>

    <Transition name="fade">
      <div v-if="showHint" class="hint-bubble">返回主页</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { colors } from '@/styles/colors.js';
import { Home } from '@icon-park/vue-next'

const router = useRouter();

const showHint = ref(true);

onMounted(() => {
  // 启动一个3秒的定时器
  setTimeout(() => {
    // 3秒后，隐藏提示语
    showHint.value = false;
  }, 3000);
});

const goToHome = () => {
  router.push('/');
};
</script>

<style scoped>
.floating-wrapper {
  position: fixed;
  z-index: 9999;
  /* 调整位置避免与其他按钮重合 */
  top: 70px;
  right: 10px;
  /* 让内部元素可以相对于它定位 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.floating-home-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: v-bind('colors.brand.primary');
  cursor: pointer;
  border: 2px solid v-bind('colors.shadow.lightHover');
  box-shadow: 0 4px 12px v-bind('colors.shadow.primary');
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-home-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px v-bind('colors.shadow.primaryHover');
}

/* 提示气泡样式 */
.hint-bubble {
  /* 绝对定位，相对于 .floating-wrapper */
  position: absolute;
  /* 放在悬浮球左侧，留出一点空隙 */
  right: 100%;
  margin-right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background-color: v-bind('colors.shadow.primaryHover');
  color: v-bind('colors.text.primary');
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

/* 在大屏幕上调整位置 */
@media (min-width: 768px) {
  .floating-wrapper {
    top: 80px;
    right: 20px;
  }
}

/* 气泡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
