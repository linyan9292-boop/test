// 角色技能配置
export const CHARACTER_SKILLS = {
  // 战士类技能
  warrior: {
    basic: {
      name: "重击",
      description: "造成150%攻击力的伤害",
      cooldown: 0,
      damageMultiplier: 1.5,
      type: "attack",
      effect: "none"
    },
    skill: {
      name: "战吼",
      description: "提升全队攻击力20%，持续3回合",
      cooldown: 3,
      damageMultiplier: 0,
      type: "buff",
      effect: "team_atk_boost",
      duration: 3,
      value: 0.2
    },
    ultimate: {
      name: "狂暴打击",
      description: "造成300%攻击力的伤害，并眩晕敌人1回合",
      cooldown: 5,
      damageMultiplier: 3.0,
      type: "attack",
      effect: "stun",
      duration: 1
    }
  },

  // 法师类技能
  mage: {
    basic: {
      name: "火球术",
      description: "造成120%攻击力的魔法伤害",
      cooldown: 0,
      damageMultiplier: 1.2,
      type: "magic",
      effect: "none"
    },
    skill: {
      name: "冰冻术",
      description: "造成80%攻击力的伤害，并冻结敌人1回合",
      cooldown: 2,
      damageMultiplier: 0.8,
      type: "magic",
      effect: "freeze",
      duration: 1
    },
    ultimate: {
      name: "陨石术",
      description: "造成250%攻击力的范围伤害",
      cooldown: 4,
      damageMultiplier: 2.5,
      type: "magic",
      effect: "none"
    }
  },

  // 游侠类技能
  ranger: {
    basic: {
      name: "精准射击",
      description: "造成130%攻击力的伤害",
      cooldown: 0,
      damageMultiplier: 1.3,
      type: "attack",
      effect: "none"
    },
    skill: {
      name: "毒箭",
      description: "造成100%攻击力的伤害，并施加中毒效果",
      cooldown: 2,
      damageMultiplier: 1.0,
      type: "attack",
      effect: "poison",
      duration: 3
    },
    ultimate: {
      name: "箭雨",
      description: "造成200%攻击力的范围伤害",
      cooldown: 4,
      damageMultiplier: 2.0,
      type: "attack",
      effect: "none"
    }
  },

  // 治疗者类技能
  healer: {
    basic: {
      name: "治疗术",
      description: "恢复我方80%攻击力的生命值",
      cooldown: 0,
      damageMultiplier: -0.8,
      type: "heal",
      effect: "none"
    },
    skill: {
      name: "净化",
      description: "移除所有负面状态，并恢复50%攻击力的生命值",
      cooldown: 3,
      damageMultiplier: -0.5,
      type: "heal",
      effect: "cleanse"
    },
    ultimate: {
      name: "神圣庇护",
      description: "恢复150%攻击力的生命值，并提升防御力30%",
      cooldown: 5,
      damageMultiplier: -1.5,
      type: "heal",
      effect: "def_boost",
      duration: 3,
      value: 0.3
    }
  }
}

// 技能类型映射
export const SKILL_TYPE_MAP = {
  'warrior': '战士',
  'mage': '法师',
  'ranger': '游侠',
  'healer': '治疗者'
}

// 获取角色技能
export const getCharacterSkills = (characterType) => {
  return CHARACTER_SKILLS[characterType] || CHARACTER_SKILLS.warrior
}

// 获取技能类型名称
export const getSkillTypeName = (type) => {
  return SKILL_TYPE_MAP[type] || '未知'
}
