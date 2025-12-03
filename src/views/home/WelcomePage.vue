<template>
  <div class="welcome-bg">
    <div class="welcome-shell">
      <div class="welcome-header">
        <div class="welcome-logo">🎉</div>
        <h1 class="welcome-title">盲盒派对</h1>
        <p class="welcome-subtitle">抽卡 · 闯关 · 养成，一站式轻游乐园</p>
      </div>

      <div class="welcome-main-actions">
        <router-link to="/chouka" class="welcome-btn primary">立即开始抽卡</router-link>
        <router-link to="/game/zaodaoji" class="welcome-btn secondary">进入闯关模式</router-link>
      </div>

      <div class="welcome-quick-grid">
        <router-link to="/team" class="welcome-quick-item">
          <div class="icon">🛡️</div>
          <div class="label">队伍配置</div>
        </router-link>
        <router-link to="/dungeon" class="welcome-quick-item">
          <div class="icon">⚔️</div>
          <div class="label">装备副本</div>
        </router-link>
        <router-link to="/inventory" class="welcome-quick-item">
          <div class="icon">🎒</div>
          <div class="label">背包</div>
        </router-link>
        <router-link to="/voucher" class="welcome-quick-item">
          <div class="icon">🎟️</div>
          <div class="label">代金券</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { colors } from '@/styles/colors.js'
</script>

<style scoped>
.welcome-bg {
  min-height: 100dvh;
  padding: 1.5rem 1rem 5rem;
  box-sizing: border-box;
  background: radial-gradient(circle at top, #1f2933 0, #020617 50%, #000 100%);
  display: flex;
  justify-content: center;
}

.welcome-shell {
  width: 100%;
  max-width: 480px;
  margin: auto;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.8);
  padding: 1.8rem 1.4rem 1.6rem;
  color: v-bind('colors.text.primary');
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.welcome-header {
  text-align: center;
}

.welcome-logo {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 0, #4f46e5, #7c3aed);
  box-shadow: 0 10px 30px rgba(88, 28, 135, 0.6);
  font-size: 2rem;
}

.welcome-title {
  font-size: 1.8rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.4rem;
}

.welcome-subtitle {
  font-size: 0.9rem;
  color: v-bind('colors.text.secondary');
}

.welcome-main-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.welcome-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.15s ease;
}

.welcome-btn.primary {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #f9fafb;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.6);
}

.welcome-btn.secondary {
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  border: 1px solid rgba(148, 163, 184, 0.6);
}

.welcome-btn:active {
  transform: translateY(1px);
  box-shadow: none;
}

.welcome-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.25rem;
  padding: 0.4rem 0.3rem 0;
}

.welcome-quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.2rem;
  border-radius: 10px;
  text-decoration: none;
  color: v-bind('colors.text.secondary');
  font-size: 0.7rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(55, 65, 81, 0.8);
}

.welcome-quick-item .icon {
  font-size: 1.3rem;
  margin-bottom: 0.1rem;
}

.welcome-quick-item .label {
  white-space: nowrap;
}

@media (max-width: 480px) {
  .welcome-shell {
    border-radius: 14px;
    padding: 1.4rem 1.1rem 1.3rem;
  }

  .welcome-title {
    font-size: 1.6rem;
  }

  .welcome-quick-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
