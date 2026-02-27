/**
 * 能力接口定义
 *
 * 核心思想：每个能力是一个可复用的、可组合的模块
 */

export interface Ability {
  name: string;
  description: string;
  category: 'data' | 'ui' | 'interaction' | 'logic';
  fn: (props: any) => React.ReactNode;
}

/**
 * 编排结果
 */
export interface Orchestration {
  intent: string;
  abilities: string[];
  orchestration: string;
  code: string;
}

/**
 * 能力库
 */
export const ABILITIES = {
  // 数据层能力
  storage: {
    name: 'storage',
    description: '数据存储和管理',
    category: 'data' as const,
    fn: (props: any) => null // 运行时实现
  },

  persistence: {
    name: 'persistence',
    description: '数据持久化（localStorage）',
    category: 'data' as const,
    fn: (props: any) => null
  },

  export: {
    name: 'export',
    description: '数据导出（CSV/JSON）',
    category: 'data' as const,
    fn: (props: any) => null
  },

  // UI层能力
  formInput: {
    name: 'form-input',
    description: '表单输入',
    category: 'ui' as const,
    fn: (props: any) => null
  },

  listDisplay: {
    name: 'list-display',
    description: '列表展示',
    category: 'ui' as const,
    fn: (props: any) => null
  },

  cardDisplay: {
    name: 'card-display',
    description: '卡片展示',
    category: 'ui' as const,
    fn: (props: any) => null
  },

  chart: {
    name: 'chart',
    description: '图表可视化',
    category: 'ui' as const,
    fn: (props: any) => null
  },

  // 交互层能力
  add: {
    name: 'add',
    description: '添加记录',
    category: 'interaction' as const,
    fn: (props: any) => null
  },

  edit: {
    name: 'edit',
    description: '编辑记录',
    category: 'interaction' as const,
    fn: (props: any) => null
  },

  delete: {
    name: 'delete',
    description: '删除记录',
    category: 'interaction' as const,
    fn: (props: any) => null
  },

  toggle: {
    name: 'toggle',
    description: '切换状态（完成/未完成）',
    category: 'interaction' as const,
    fn: (props: any) => null
  },

  filter: {
    name: 'filter',
    description: '过滤数据',
    category: 'interaction' as const,
    fn: (props: any) => null
  },

  sort: {
    name: 'sort',
    description: '排序数据',
    category: 'interaction' as const,
    fn: (props: any) => null
  }
};
