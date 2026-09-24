const zh = {
  app: {
    name: '做饭记录',
  },
  nav: {
    ingredients: '食材',
    meals: '记录',
    ai: 'AI',
    settings: '设置',
  },
  pages: {
    ingredients: {
      title: '食材库存',
      empty: '还没有食材，之后可以在这里记录库存。',
    },
    meals: {
      title: '饮食日记',
      empty: '还没有记录，之后可以在这里记下每一顿饭。',
    },
    ai: {
      title: 'AI 助手',
      empty: '营养点评和食谱推荐将在这里出现（需在设置中开启）。',
    },
    settings: {
      title: '设置',
      empty: '提醒、标签、AI、导出导入等设置将在这里出现。',
    },
  },
  common: {
    comingSoon: '即将推出',
  },
}

export default zh
// 其他语言文件需要和中文保持相同的结构
export type Resources = typeof zh
