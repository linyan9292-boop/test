// 每日任务配置
export const DAILY_TASKS = [
  {
    id: 'daily_battle_3',
    name: '日常战斗',
    description: '完成3次战斗',
    type: 'battle',
    target: 3,
    reward: {
      diamonds: 50,
      exp: 100
    }
  },
  {
    id: 'daily_stage_5',
    name: '关卡推进',
    description: '通过5个关卡',
    type: 'stage',
    target: 5,
    reward: {
      diamonds: 80,
      exp: 150
    }
  },
  {
    id: 'daily_gacha_2',
    name: '卡牌抽取',
    description: '进行2次抽卡',
    type: 'gacha',
    target: 2,
    reward: {
      diamonds: 30,
      tokens: 2
    }
  },
  {
    id: 'daily_equip_craft',
    name: '装备强化',
    description: '合成1件装备',
    type: 'craft',
    target: 1,
    reward: {
      diamonds: 60,
      exp: 80
    }
  },
  {
    id: 'daily_team_power',
    name: '提升战力',
    description: '队伍战力达到500',
    type: 'power',
    target: 500,
    reward: {
      diamonds: 100,
      exp: 200
    }
  }
]

// 成就系统配置
export const ACHIEVEMENTS = [
  {
    id: 'first_victory',
    name: '初次胜利',
    description: '赢得第一场战斗',
    type: 'milestone',
    reward: {
      diamonds: 100,
      title: '新手战士'
    }
  },
  {
    id: 'stage_10',
    name: '关卡大师',
    description: '通关第10关',
    type: 'milestone',
    reward: {
      diamonds: 500,
      title: '关卡征服者'
    }
  },
  {
    id: 'collect_20',
    name: '收藏家',
    description: '收集20张不同卡牌',
    type: 'collection',
    target: 20,
    reward: {
      diamonds: 300,
      title: '卡牌收藏家'
    }
  },
  {
    id: 'power_1000',
    name: '强者之路',
    description: '队伍战力达到1000',
    type: 'power',
    target: 1000,
    reward: {
      diamonds: 400,
      title: '强力指挥官'
    }
  },
  {
    id: 'craft_10',
    name: '锻造大师',
    description: '合成10件装备',
    type: 'craft',
    target: 10,
    reward: {
      diamonds: 250,
      title: '装备大师'
    }
  }
]

// 签到奖励配置
export const SIGN_IN_REWARDS = [
  { day: 1, diamonds: 20, exp: 50 },
  { day: 2, diamonds: 30, exp: 60 },
  { day: 3, diamonds: 40, exp: 80 },
  { day: 4, diamonds: 50, exp: 100 },
  { day: 5, diamonds: 60, exp: 120 },
  { day: 6, diamonds: 80, exp: 150 },
  { day: 7, diamonds: 100, exp: 200, extra: '10连抽卡券' }
]
