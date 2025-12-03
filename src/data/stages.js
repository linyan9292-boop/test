// 关卡配置
export const STAGE_CONFIG = [
  {
    id: 1,
    name: "新手村",
    theme: "forest",
    recommendPower: 80,
    enemyCount: 2,
    isBoss: false,
    description: "适合新手的初始关卡",
    specialMechanic: "none",
    mechanicDescription: ""
  },
  {
    id: 2,
    name: "幽暗森林",
    theme: "forest",
    recommendPower: 160,
    enemyCount: 3,
    isBoss: false,
    description: "森林深处的挑战",
    specialMechanic: "poison",
    mechanicDescription: "每回合结束时受到少量毒素伤害"
  },
  {
    id: 3,
    name: "水晶洞穴",
    theme: "cave",
    recommendPower: 240,
    enemyCount: 3,
    isBoss: false,
    description: "闪闪发光的水晶洞穴",
    specialMechanic: "crystal_power",
    mechanicDescription: "每3回合获得攻击力加成"
  },
  {
    id: 4,
    name: "熔岩地带",
    theme: "fire",
    recommendPower: 360,
    enemyCount: 4,
    isBoss: false,
    description: "炽热的熔岩区域",
    specialMechanic: "burning",
    mechanicDescription: "造成额外火焰伤害，但自身也受到灼烧"
  },
  {
    id: 5,
    name: "冰霜要塞",
    theme: "ice",
    recommendPower: 480,
    enemyCount: 4,
    isBoss: true,
    description: "第一个Boss关卡",
    specialMechanic: "freeze",
    mechanicDescription: "Boss每2回合冻结一名敌人，使其无法攻击"
  },
  {
    id: 6,
    name: "风暴平原",
    theme: "plains",
    recommendPower: 640,
    enemyCount: 4,
    isBoss: false,
    description: "狂风呼啸的平原",
    specialMechanic: "wind_boost",
    mechanicDescription: "速度属性获得额外加成"
  },
  {
    id: 7,
    name: "暗影沼泽",
    theme: "swamp",
    recommendPower: 800,
    enemyCount: 5,
    isBoss: false,
    description: "危险的沼泽地带",
    specialMechanic: "healing_reduction",
    mechanicDescription: "治疗效果降低50%"
  },
  {
    id: 8,
    name: "天空之城",
    theme: "sky",
    recommendPower: 1000,
    enemyCount: 5,
    isBoss: false,
    description: "漂浮在空中的城市",
    specialMechanic: "lightning",
    mechanicDescription: "每回合有概率触发连锁闪电"
  },
  {
    id: 9,
    name: "龙之巢穴",
    theme: "dragon",
    recommendPower: 1200,
    enemyCount: 5,
    isBoss: true,
    description: "巨龙的栖息地",
    specialMechanic: "dragon_rage",
    mechanicDescription: "Boss血量低于50%时攻击力翻倍"
  },
  {
    id: 10,
    name: "终极试炼",
    theme: "final",
    recommendPower: 1500,
    enemyCount: 6,
    isBoss: true,
    description: "最终的挑战",
    specialMechanic: "chaos_mode",
    mechanicDescription: "随机触发各种特殊效果"
  }
]

// 主题配置
export const STAGE_THEMES = {
  forest: {
    name: "森林",
    bgColor: "#2d5016",
    enemyTypes: ["slime", "goblin", "wolf"]
  },
  cave: {
    name: "洞穴",
    bgColor: "#1a1a2e",
    enemyTypes: ["bat", "spider", "golem"]
  },
  fire: {
    name: "火焰",
    bgColor: "#8b0000",
    enemyTypes: ["fire_spirit", "lava_beast", "salamander"]
  },
  ice: {
    name: "冰霜",
    bgColor: "#4682b4",
    enemyTypes: ["ice_elemental", "frost_wolf", "yeti"]
  },
  plains: {
    name: "平原",
    bgColor: "#daa520",
    enemyTypes: ["harpy", "centaur", "griffin"]
  },
  swamp: {
    name: "沼泽",
    bgColor: "#556b2f",
    enemyTypes: ["poison_frog", "swamp_troll", "hydra"]
  },
  sky: {
    name: "天空",
    bgColor: "#87ceeb",
    enemyTypes: ["cloud_elemental", "thunder_bird", "sky_dragon"]
  },
  dragon: {
    name: "龙巢",
    bgColor: "#8b008b",
    enemyTypes: ["dragon_whelp", "drake", "ancient_dragon"]
  },
  final: {
    name: "终极",
    bgColor: "#4b0082",
    enemyTypes: ["chaos_beast", "void_lord", "final_boss"]
  }
}

// 获取关卡配置
export const getStageConfig = (stageId) => {
  return STAGE_CONFIG.find(stage => stage.id === stageId)
}

// 获取主题配置
export const getThemeConfig = (theme) => {
  return STAGE_THEMES[theme] || STAGE_THEMES.forest
}
