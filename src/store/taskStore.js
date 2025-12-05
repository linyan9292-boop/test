import { ref } from 'vue'
import { DAILY_TASKS, ACHIEVEMENTS, SIGN_IN_REWARDS } from '@/data/dailyTasks.js'

// 每日任务进度
export const dailyTaskProgress = ref({})

// 成就进度
export const achievementProgress = ref({})

// 签到状态
export const signInStatus = ref({
  lastSignInDate: null,
  consecutiveDays: 0,
  claimedToday: false
})

// 初始化任务进度
export const initDailyTasks = () => {
  const today = new Date().toDateString()

  // 检查是否需要重置每日任务
  if (signInStatus.value.lastSignInDate !== today) {
    dailyTaskProgress.value = {}
    signInStatus.value.claimedToday = false

    // 检查连续签到
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (signInStatus.value.lastSignInDate === yesterday.toDateString()) {
      signInStatus.value.consecutiveDays++
    } else {
      signInStatus.value.consecutiveDays = 1
    }

    signInStatus.value.lastSignInDate = today
  }

  // 初始化每日任务进度
  DAILY_TASKS.forEach(task => {
    if (!dailyTaskProgress.value[task.id]) {
      dailyTaskProgress.value[task.id] = {
        current: 0,
        completed: false,
        claimed: false
      }
    }
  })

  // 初始化成就进度
  ACHIEVEMENTS.forEach(achievement => {
    if (!achievementProgress.value[achievement.id]) {
      achievementProgress.value[achievement.id] = {
        current: 0,
        completed: false,
        claimed: false
      }
    }
  })
}

// 更新任务进度
export const updateTaskProgress = (taskType, amount = 1) => {
  DAILY_TASKS.forEach(task => {
    if (task.type === taskType && !dailyTaskProgress.value[task.id].completed) {
      dailyTaskProgress.value[task.id].current = Math.min(
        dailyTaskProgress.value[task.id].current + amount,
        task.target
      )

      if (dailyTaskProgress.value[task.id].current >= task.target) {
        dailyTaskProgress.value[task.id].completed = true
      }
    }
  })
}

// 更新成就进度
export const updateAchievementProgress = (achievementType, current, target = null) => {
  ACHIEVEMENTS.forEach(achievement => {
    if (achievement.type === achievementType && !achievementProgress.value[achievement.id].completed) {
      const newProgress = target !== null ? target : current
      achievementProgress.value[achievement.id].current = newProgress

      const requiredTarget = achievement.target || 1
      if (newProgress >= requiredTarget) {
        achievementProgress.value[achievement.id].completed = true
      }
    }
  })
}

// 领取每日任务奖励
export const claimDailyTaskReward = (taskId) => {
  const task = dailyTaskProgress.value[taskId]
  if (!task || !task.completed || task.claimed) {
    return false
  }

  const taskConfig = DAILY_TASKS.find(t => t.id === taskId)
  if (!taskConfig) return false

  task.claimed = true

  // 这里应该调用相应的奖励发放逻辑
  console.log('领取每日任务奖励:', taskConfig.reward)

  return taskConfig.reward
}

// 领取成就奖励
export const claimAchievementReward = (achievementId) => {
  const achievement = achievementProgress.value[achievementId]
  if (!achievement || !achievement.completed || achievement.claimed) {
    return false
  }

  const achievementConfig = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!achievementConfig) return false

  achievement.claimed = true

  // 这里应该调用相应的奖励发放逻辑
  console.log('领取成就奖励:', achievementConfig.reward)

  return achievementConfig.reward
}

// 签到
export const signIn = () => {
  if (signInStatus.value.claimedToday) {
    return false
  }

  signInStatus.value.claimedToday = true

  const dayIndex = (signInStatus.value.consecutiveDays - 1) % 7 + 1
  const reward = SIGN_IN_REWARDS.find(r => r.day === dayIndex)

  console.log('签到奖励:', reward)

  return reward
}

// 获取今日可领取的任务
export const getAvailableDailyTasks = () => {
  return DAILY_TASKS.filter(task =>
    dailyTaskProgress.value[task.id]?.completed &&
    !dailyTaskProgress.value[task.id]?.claimed
  )
}

// 获取已完成的成就
export const getCompletedAchievements = () => {
  return ACHIEVEMENTS.filter(achievement =>
    achievementProgress.value[achievement.id]?.completed &&
    !achievementProgress.value[achievement.id]?.claimed
  )
}
