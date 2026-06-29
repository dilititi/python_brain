export const abilityDimensionOrder = [
  "linguistic",
  "logical_mathematical",
  "spatial",
  "musical",
  "bodily_kinesthetic",
  "interpersonal",
  "intrapersonal",
  "naturalistic",
  "existential"
] as const;

export type AbilityDimension = (typeof abilityDimensionOrder)[number];

export const abilityDimensionMeta: Record<
  AbilityDimension,
  {
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  linguistic: {
    label: "语言智能",
    shortLabel: "语言",
    description: "关注通过概念、叙述、解释和文本细读来组织理解的能力维度。"
  },
  logical_mathematical: {
    label: "逻辑—数学智能",
    shortLabel: "逻辑",
    description: "关注区分关系、推理结构、分类规则和论证步骤的能力维度。"
  },
  spatial: {
    label: "空间智能",
    shortLabel: "空间",
    description: "关注用结构、位置、层级和关系图式来理解对象的能力维度。"
  },
  musical: {
    label: "音乐智能",
    shortLabel: "音乐",
    description: "关注节奏、形式、重复和差异如何帮助把握材料组织的能力维度。"
  },
  bodily_kinesthetic: {
    label: "身体—运动智能",
    shortLabel: "身体",
    description: "关注身体实践、习惯、技术和行动方式如何参与理解的能力维度。"
  },
  interpersonal: {
    label: "人际智能",
    shortLabel: "人际",
    description: "关注权力关系、角色位置、互动规则和共同生活形式的能力维度。"
  },
  intrapersonal: {
    label: "内省智能",
    shortLabel: "内省",
    description: "关注自我反思、立场变化、判断保留和理解边界的能力维度。"
  },
  naturalistic: {
    label: "自然观察智能",
    shortLabel: "自然",
    description: "关注分类、观察、差异辨认和对象谱系整理的能力维度。"
  },
  existential: {
    label: "存在智能",
    shortLabel: "存在",
    description: "关注意义、历史方向、有限性、价值和根本问题的能力维度。"
  }
};
