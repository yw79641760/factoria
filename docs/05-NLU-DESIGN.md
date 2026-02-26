# Factoria NLU 需求解析设计

## 文档信息
- **版本**: 1.0
- **创建日期**: 2026-02-25
- **维护者**: Factoria Team
- **状态**: 🚧 设计中

## 1. NLU系统概述

### 1.1 核心职责

NLU (Natural Language Understanding) 系统负责：

1. **意图识别** - 理解用户想要什么类型的APP
2. **参数提取** - 从自然语言中提取结构化数据
3. **歧义消除** - 处理不明确的需求
4. **需求补全** - 基于上下文补充缺失信息

### 1.2 设计目标

- **准确性** - 意图识别准确率 > 90%
- **速度** - 解析时间 < 3秒
- **容错性** - 能处理模糊、不完整的需求
- **可扩展** - 支持新增模板类型

### 1.3 技术选型

**LLM选择**: GLM-5 (智谱AI)

**理由**:
- ✅ 中文理解能力强
- ✅ 结构化输出质量高
- ✅ 成本低（¥0.001/千tokens）
- ✅ API稳定可靠

## 2. 意图识别系统

### 2.1 支持的意图类型

| 意图类型 | 描述 | 关键词示例 |
|---------|------|-----------|
| `tracker` | 数据追踪 | 追踪、记录、统计、习惯 |
| `todo` | 待办清单 | 清单、任务、待办、计划 |
| `calculator` | 计算器 | 计算、换算、公式、BMI |
| `countdown` | 倒计时 | 倒计时、距离、还有多少天 |
| `notes` | 笔记 | 笔记、记录、备忘、日记 |

### 2.2 Prompt模板

```typescript
// lib/nlu/prompt-template.ts

export const NLU_PROMPT = `
你是一个APP需求解析专家。请分析用户的需求，提取以下信息：

1. **意图类型** (type): 选择以下之一
   - tracker: 数据追踪（体重、开支、习惯等）
   - todo: 待办清单（任务、计划）
   - calculator: 计算器（BMI、汇率、单位换算）
   - countdown: 倒计时（生日、纪念日）
   - notes: 笔记（记录、备忘）

2. **应用名称** (name): 简洁的应用名称（2-8字）

3. **数据字段** (fields): 用户需要记录/输入的数据
   - 每个字段包含: name, type, required
   - 类型: text, number, date, select, textarea

4. **功能特性** (features): 可选功能
   - chart: 图表展示
   - export: 导出功能
   - search: 搜索过滤
   - share: 分享功能
   - reminder: 提醒通知

用户需求：
"""
{prompt}
"""

请以JSON格式返回结果，不要包含其他说明文字。
`;
```

### 2.3 意图识别流程

```
用户输入
  "追踪每天喝水量，显示趋势图"
    ↓
【Step 1: 预处理】
  - 去除标点符号
  - 统一全角/半角
  - 分词
    ↓
【Step 2: LLM解析】
  - 构建Prompt
  - 调用GLM-5 API
  - 获取JSON响应
    ↓
【Step 3: 结果解析】
  - JSON解析
  - 字段验证
  - 类型转换
    ↓
【Step 4: 后处理】
  - 补充默认值
  - 优化字段名称
  - 添加置信度
    ↓
Intent对象
  {
    type: "tracker",
    name: "喝水量追踪",
    fields: [...],
    features: ["chart"]
  }
```

### 2.4 实现代码

```typescript
// lib/nlu/parser.ts

import { GLM5Client } from './glm5-client';

export class NLUProcessor {
  private client: GLM5Client;

  constructor(apiKey: string) {
    this.client = new GLM5Client(apiKey);
  }

  /**
   * 解析用户需求
   */
  async parse(prompt: string): Promise<Intent> {
    // 1. 预处理
    const cleanedPrompt = this.preprocess(prompt);

    // 2. 构建Prompt
    const fullPrompt = this.buildPrompt(cleanedPrompt);

    // 3. 调用LLM
    const response = await this.client.chat(fullPrompt, {
      temperature: 0.3,  // 低温度，更确定性的输出
      maxTokens: 1000
    });

    // 4. 解析结果
    const intent = this.parseResponse(response);

    // 5. 验证和补全
    return this.validate(intent);
  }

  /**
   * 预处理用户输入
   */
  private preprocess(prompt: string): string {
    // 去除多余空格
    let cleaned = prompt.trim();

    // 统一标点符号
    cleaned = cleaned.replace(/，/g, ',');
    cleaned = cleaned.replace(/。/g, '.');

    return cleaned;
  }

  /**
   * 构建完整Prompt
   */
  private buildPrompt(prompt: string): string {
    return NLU_PROMPT.replace('{prompt}', prompt);
  }

  /**
   * 解析LLM响应
   */
  private parseResponse(response: string): Intent {
    try {
      // 提取JSON（处理可能的markdown代码块）
      let jsonStr = response;
      
      if (response.includes('```json')) {
        const match = response.match(/```json\n([\s\S]+?)\n```/);
        if (match) {
          jsonStr = match[1];
        }
      }

      // 解析JSON
      const parsed = JSON.parse(jsonStr);

      // 转换为Intent对象
      const intent: Intent = {
        type: parsed.type || 'tracker',
        name: parsed.name || '未命名应用',
        description: parsed.description,
        fields: this.normalizeFields(parsed.fields || []),
        features: parsed.features || [],
        confidence: 0.9  // 默认置信度
      };

      return intent;
    } catch (error) {
      // JSON解析失败，返回默认Intent
      console.error('Failed to parse LLM response:', error);
      return this.getDefaultIntent();
    }
  }

  /**
   * 标准化字段定义
   */
  private normalizeFields(fields: any[]): Field[] {
    return fields.map(field => {
      // 处理字符串格式的字段
      if (typeof field === 'string') {
        return {
          name: field,
          type: 'text',
          required: true
        };
      }

      // 处理对象格式的字段
      return {
        name: field.name,
        type: field.type || 'text',
        required: field.required !== false,
        options: field.options,
        validation: field.validation,
        defaultValue: field.defaultValue,
        placeholder: field.placeholder
      };
    });
  }

  /**
   * 验证和补全Intent
   */
  private validate(intent: Intent): Intent {
    // 验证type
    const validTypes = ['tracker', 'todo', 'calculator', 'countdown', 'notes'];
    if (!validTypes.includes(intent.type)) {
      intent.type = 'tracker';  // 默认类型
      intent.confidence = 0.5;  // 降低置信度
    }

    // 验证name
    if (!intent.name || intent.name.trim().length === 0) {
      intent.name = '未命名应用';
    }

    // 补全默认字段
    if (!intent.fields || intent.fields.length === 0) {
      intent.fields = this.getDefaultFields(intent.type);
    }

    // 去重features
    if (intent.features) {
      intent.features = Array.from(new Set(intent.features));
    }

    return intent;
  }

  /**
   * 获取默认字段
   */
  private getDefaultFields(type: string): Field[] {
    const defaults: Record<string, Field[]> = {
      tracker: [
        { name: '日期', type: 'date', required: true },
        { name: '数值', type: 'number', required: true }
      ],
      todo: [
        { name: '任务', type: 'text', required: true },
        { name: '完成状态', type: 'select', options: ['未完成', '已完成'] }
      ],
      calculator: [
        { name: '输入值1', type: 'number', required: true },
        { name: '输入值2', type: 'number', required: true }
      ],
      countdown: [
        { name: '事件名称', type: 'text', required: true },
        { name: '目标日期', type: 'date', required: true }
      ],
      notes: [
        { name: '标题', type: 'text', required: true },
        { name: '内容', type: 'textarea', required: true }
      ]
    };

    return defaults[type] || defaults.tracker;
  }

  /**
   * 获取默认Intent
   */
  private getDefaultIntent(): Intent {
    return {
      type: 'tracker',
      name: '数据追踪',
      fields: this.getDefaultFields('tracker'),
      features: [],
      confidence: 0.3
    };
  }
}
```

## 3. 参数提取系统

### 3.1 字段类型推断

根据用户需求自动推断字段类型：

```typescript
// lib/nlu/field-inference.ts

export class FieldInferrer {
  /**
   * 推断字段类型
   */
  infer(fieldName: string, context: string): FieldType {
    const name = fieldName.toLowerCase();
    const ctx = context.toLowerCase();

    // 日期字段
    if (this.isDateField(name, ctx)) {
      return 'date';
    }

    // 数字字段
    if (this.isNumberField(name, ctx)) {
      return 'number';
    }

    // 选择字段
    if (this.isSelectField(name, ctx)) {
      return 'select';
    }

    // 长文本字段
    if (this.isTextareaField(name, ctx)) {
      return 'textarea';
    }

    // 默认文本字段
    return 'text';
  }

  private isDateField(name: string, ctx: string): boolean {
    const dateKeywords = ['日期', '时间', 'date', 'time', '年', '月', '日'];
    return dateKeywords.some(k => name.includes(k) || ctx.includes(k));
  }

  private isNumberField(name: string, ctx: string): boolean {
    const numberKeywords = ['数量', '金额', '体重', '身高', '价格', '数量', 'number', 'count', 'amount'];
    const units = ['ml', 'kg', 'g', 'cm', 'm', '元', '块'];
    
    return numberKeywords.some(k => name.includes(k)) ||
           units.some(u => ctx.includes(u));
  }

  private isSelectField(name: string, ctx: string): boolean {
    const selectKeywords = ['类型', '分类', '状态', '优先级', '级别', 'type', 'category', 'status'];
    return selectKeywords.some(k => name.includes(k));
  }

  private isTextareaField(name: string, ctx: string): boolean {
    const textareaKeywords = ['描述', '备注', '内容', '详情', '说明', 'note', 'description', 'content'];
    return textareaKeywords.some(k => name.includes(k));
  }
}
```

### 3.2 验证规则生成

```typescript
// lib/nlu/validation-generator.ts

export class ValidationGenerator {
  /**
   * 根据字段类型生成验证规则
   */
  generate(field: Field): FieldValidation {
    const validation: FieldValidation = {};

    switch (field.type) {
      case 'number':
        // 数字字段添加范围限制
        validation.min = 0;
        validation.max = 1000000;
        break;

      case 'text':
        // 文本字段添加长度限制
        validation.minLength = 1;
        validation.maxLength = 200;
        break;

      case 'textarea':
        // 长文本字段
        validation.maxLength = 5000;
        break;

      case 'date':
        // 日期字段添加范围
        validation.min = '1900-01-01';
        validation.max = '2100-12-31';
        break;
    }

    return validation;
  }
}
```

## 4. 歧义消除系统

### 4.1 常见歧义场景

| 歧义类型 | 示例 | 处理方式 |
|---------|------|---------|
| **类型歧义** | "记录体重" | 询问：追踪体重变化 or 记录一次体重？ |
| **字段缺失** | "记账APP" | 补充默认字段：日期、金额、类别 |
| **需求模糊** | "做一个APP" | 提供示例选择 |
| **冲突需求** | "追踪喝水，还能计算BMI" | 选择主要功能或询问 |

### 4.2 歧义检测

```typescript
// lib/nlu/ambiguity-detector.ts

export class AmbiguityDetector {
  /**
   * 检测需求中的歧义
   */
  detect(prompt: string, intent: Intent): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];

    // 1. 检测类型歧义
    const typeAmbiguity = this.detectTypeAmbiguity(prompt);
    if (typeAmbiguity) {
      ambiguities.push(typeAmbiguity);
    }

    // 2. 检测字段缺失
    if (!intent.fields || intent.fields.length === 0) {
      ambiguities.push({
        type: 'missing_fields',
        message: '缺少必要的字段定义',
        suggestion: this.suggestFields(intent.type)
      });
    }

    // 3. 检测需求过于模糊
    if (prompt.length < 10) {
      ambiguities.push({
        type: 'too_vague',
        message: '需求描述过于简短',
        suggestion: '请提供更多详细信息'
      });
    }

    return ambiguities;
  }

  /**
   * 检测类型歧义
   */
  private detectTypeAmbiguity(prompt: string): Ambiguity | null {
    const lower = prompt.toLowerCase();

    // 同时包含多个类型关键词
    const typeKeywords = {
      tracker: ['追踪', '记录', '统计', 'tracker', 'record'],
      todo: ['待办', '任务', '清单', 'todo', 'task'],
      calculator: ['计算', '换算', 'calculator', 'calculate'],
      countdown: ['倒计时', 'countdown'],
      notes: ['笔记', '记录', 'notes', 'note']
    };

    const detectedTypes: string[] = [];

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(k => lower.includes(k))) {
        detectedTypes.push(type);
      }
    }

    if (detectedTypes.length > 1) {
      return {
        type: 'ambiguous_type',
        message: `检测到多个可能的类型: ${detectedTypes.join(', ')}`,
        options: detectedTypes.map(t => ({
          value: t,
          label: this.getTypeLabel(t)
        }))
      };
    }

    return null;
  }

  /**
   * 获取类型标签
   */
  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      tracker: '数据追踪',
      todo: '待办清单',
      calculator: '计算器',
      countdown: '倒计时',
      notes: '笔记'
    };
    return labels[type] || type;
  }

  /**
   * 建议字段
   */
  private suggestFields(type: string): Field[] {
    const suggestions: Record<string, Field[]> = {
      tracker: [
        { name: '日期', type: 'date', required: true },
        { name: '数值', type: 'number', required: true },
        { name: '备注', type: 'textarea', required: false }
      ],
      todo: [
        { name: '任务名称', type: 'text', required: true },
        { name: '优先级', type: 'select', options: ['高', '中', '低'] },
        { name: '截止日期', type: 'date', required: false }
      ]
    };

    return suggestions[type] || [];
  }
}

interface Ambiguity {
  type: string;
  message: string;
  options?: Array<{ value: string; label: string }>;
  suggestion?: string | Field[];
}
```

### 4.3 用户确认流程

```typescript
// lib/nlu/confirmation-flow.ts

export class ConfirmationFlow {
  /**
   * 生成确认问题
   */
  generateQuestions(ambiguities: Ambiguity[]): Question[] {
    const questions: Question[] = [];

    for (const ambiguity of ambiguities) {
      switch (ambiguity.type) {
        case 'ambiguous_type':
          questions.push({
            id: 'confirm_type',
            text: ambiguity.message,
            type: 'single_choice',
            options: ambiguity.options
          });
          break;

        case 'missing_fields':
          if (Array.isArray(ambiguity.suggestion)) {
            questions.push({
              id: 'confirm_fields',
              text: '建议添加以下字段，是否继续？',
              type: 'multi_choice',
              options: ambiguity.suggestion.map(f => ({
                value: f.name,
                label: `${f.name} (${f.type})`,
                default: true
              }))
            });
          }
          break;

        case 'too_vague':
          questions.push({
            id: 'more_details',
            text: ambiguity.message,
            type: 'text_input',
            placeholder: '请补充更多细节...'
          });
          break;
      }
    }

    return questions;
  }
}

interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multi_choice' | 'text_input';
  options?: Array<{ value: string; label: string; default?: boolean }>;
  placeholder?: string;
}
```

## 5. 需求补全系统

### 5.1 基于模板的补全

```typescript
// lib/nlu/completer.ts

export class IntentCompleter {
  private templates: Record<string, TemplateConfig> = {
    tracker: {
      defaultFields: [
        { name: '日期', type: 'date', required: true },
        { name: '数值', type: 'number', required: true }
      ],
      defaultFeatures: ['export'],
      colorScheme: 'purple'
    },
    todo: {
      defaultFields: [
        { name: '任务', type: 'text', required: true }
      ],
      defaultFeatures: ['filter'],
      colorScheme: 'blue'
    },
    // ... 其他模板
  };

  /**
   * 补全Intent
   */
  complete(intent: Intent): Intent {
    const template = this.templates[intent.type];
    if (!template) return intent;

    // 补全字段
    if (!intent.fields || intent.fields.length === 0) {
      intent.fields = [...template.defaultFields];
    }

    // 补全功能
    if (!intent.features || intent.features.length === 0) {
      intent.features = [...template.defaultFeatures];
    }

    // 添加主题配置
    if (!intent.theme) {
      intent.theme = {
        primaryColor: this.getThemeColor(template.colorScheme),
        gradient: this.getGradient(template.colorScheme)
      };
    }

    return intent;
  }

  private getThemeColor(scheme: string): string {
    const colors: Record<string, string> = {
      purple: '#8B5CF6',
      blue: '#3B82F6',
      green: '#10B981',
      pink: '#EC4899',
      indigo: '#6366F1'
    };
    return colors[scheme] || colors.purple;
  }

  private getGradient(scheme: string): string {
    const gradients: Record<string, string> = {
      purple: 'from-purple-500 to-pink-500',
      blue: 'from-blue-500 to-teal-500',
      green: 'from-green-500 to-blue-500',
      pink: 'from-pink-500 to-orange-500',
      indigo: 'from-indigo-500 to-purple-500'
    };
    return gradients[scheme] || gradients.purple;
  }
}
```

### 5.2 基于上下文的补全

```typescript
// lib/nlu/context-aware-completer.ts

export class ContextAwareCompleter {
  /**
   * 基于用户历史补全
   */
  completeWithHistory(intent: Intent, history: App[]): Intent {
    // 查找相似的应用
    const similarApps = this.findSimilarApps(intent, history);

    if (similarApps.length > 0) {
      // 使用最相似应用的配置
      const mostSimilar = similarApps[0];
      
      // 合并字段
      intent = this.mergeFields(intent, mostSimilar.intent);
      
      // 合并功能
      intent.features = Array.from(new Set([
        ...intent.features,
        ...mostSimilar.intent.features
      ]));
    }

    return intent;
  }

  /**
   * 查找相似应用
   */
  private findSimilarApps(intent: Intent, history: App[]): App[] {
    return history
      .filter(app => app.intent.type === intent.type)
      .sort((a, b) => {
        // 按相似度排序
        const similarityA = this.calculateSimilarity(intent, a.intent);
        const similarityB = this.calculateSimilarity(intent, b.intent);
        return similarityB - similarityA;
      })
      .slice(0, 3);
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(intent1: Intent, intent2: Intent): number {
    let score = 0;

    // 类型相同
    if (intent1.type === intent2.type) {
      score += 0.5;
    }

    // 字段相似度
    const fields1 = new Set(intent1.fields?.map(f => f.name) || []);
    const fields2 = new Set(intent2.fields?.map(f => f.name) || []);
    const intersection = new Set([...fields1].filter(x => fields2.has(x)));
    const union = new Set([...fields1, ...fields2]);
    
    if (union.size > 0) {
      score += (intersection.size / union.size) * 0.5;
    }

    return score;
  }

  /**
   * 合并字段
   */
  private mergeFields(intent: Intent, reference: Intent): Intent {
    if (!intent.fields) {
      intent.fields = reference.fields || [];
    } else if (reference.fields) {
      // 添加参考应用中有但当前没有的字段
      const existingNames = new Set(intent.fields.map(f => f.name));
      
      for (const field of reference.fields) {
        if (!existingNames.has(field.name)) {
          intent.fields.push({
            ...field,
            required: false  // 补充的字段默认非必填
          });
        }
      }
    }

    return intent;
  }
}
```

## 6. GLM-5 API集成

### 6.1 API客户端

```typescript
// lib/nlu/glm5-client.ts

import axios from 'axios';

export class GLM5Client {
  private apiKey: string;
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v3/model-api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 发送聊天请求
   */
  async chat(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/glm-4/chat/completions`,
        {
          model: 'glm-4',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          top_p: options.topP || 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('GLM-5 API error:', error);
      throw new Error('Failed to call GLM-5 API');
    }
  }

  /**
   * 流式聊天（用于长时间生成）
   */
  async *chatStream(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string> {
    // 实现流式响应
    // 暂时不实现，MVP阶段使用同步API
    yield await this.chat(prompt, options);
  }
}
```

### 6.2 错误处理

```typescript
// lib/nlu/error-handler.ts

export class NLUErrorHandler {
  /**
   * 处理NLU错误
   */
  handle(error: Error): NLUResult {
    console.error('NLU Error:', error);

    // 根据错误类型返回不同的结果
    if (error.message.includes('API')) {
      return {
        success: false,
        error: {
          code: 'NLU_API_ERROR',
          message: 'LLM服务暂时不可用，请稍后重试'
        }
      };
    }

    if (error.message.includes('JSON')) {
      return {
        success: false,
        error: {
          code: 'NLU_PARSE_ERROR',
          message: '需求解析失败，请尝试更清晰的描述'
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'NLU_UNKNOWN_ERROR',
        message: '未知错误，请重试'
      }
    };
  }
}
```

## 7. 测试策略

### 7.1 单元测试

```typescript
// __tests__/nlu/parser.test.ts

describe('NLUProcessor', () => {
  let processor: NLUProcessor;

  beforeEach(() => {
    processor = new NLUProcessor(process.env.GLM5_API_KEY!);
  });

  describe('parse', () => {
    test('should parse tracker intent', async () => {
      const prompt = '追踪每天喝水量，显示趋势图';
      const intent = await processor.parse(prompt);

      expect(intent.type).toBe('tracker');
      expect(intent.name).toContain('喝水量');
      expect(intent.features).toContain('chart');
    });

    test('should parse todo intent', async () => {
      const prompt = '做一个工作任务清单';
      const intent = await processor.parse(prompt);

      expect(intent.type).toBe('todo');
      expect(intent.fields.length).toBeGreaterThan(0);
    });

    test('should handle vague input', async () => {
      const prompt = '做一个APP';
      const intent = await processor.parse(prompt);

      expect(intent.confidence).toBeLessThan(0.7);
    });
  });

  describe('validate', () => {
    test('should add default fields if missing', () => {
      const intent = { type: 'tracker', name: 'Test' };
      const validated = processor.validate(intent);

      expect(validated.fields.length).toBeGreaterThan(0);
    });

    test('should fix invalid type', () => {
      const intent = { type: 'invalid', name: 'Test' };
      const validated = processor.validate(intent);

      expect(['tracker', 'todo', 'calculator', 'countdown', 'notes'])
        .toContain(validated.type);
    });
  });
});
```

### 7.2 集成测试

```typescript
// __tests__/integration/nlu-flow.test.ts

describe('NLU Integration Flow', () => {
  test('should complete full NLU flow', async () => {
    const prompt = '追踪每天喝水量';

    // 1. 解析
    const intent = await processor.parse(prompt);

    // 2. 检测歧义
    const ambiguities = detector.detect(prompt, intent);
    expect(ambiguities.length).toBe(0);

    // 3. 补全
    const completed = completer.complete(intent);
    expect(completed.fields.length).toBeGreaterThan(0);
    expect(completed.features.length).toBeGreaterThan(0);

    // 4. 验证
    const validation = validator.validate(completed);
    expect(validation.valid).toBe(true);
  });
});
```

### 7.3 性能测试

```typescript
// __tests__/performance/nlu-performance.test.ts

describe('NLU Performance', () => {
  test('should parse within 3 seconds', async () => {
    const prompt = '追踪每天喝水量';
    
    const start = Date.now();
    await processor.parse(prompt);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  test('should handle concurrent requests', async () => {
    const prompts = [
      '追踪体重',
      '待办清单',
      'BMI计算器'
    ];

    const start = Date.now();
    const results = await Promise.all(
      prompts.map(p => processor.parse(p))
    );
    const duration = Date.now() - start;

    expect(results.length).toBe(3);
    expect(duration).toBeLessThan(5000);
  });
});
```

## 8. 监控与日志

### 8.1 监控指标

```typescript
// lib/nlu/metrics.ts

export class NLUMetrics {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    typeDistribution: {
      tracker: 0,
      todo: 0,
      calculator: 0,
      countdown: 0,
      notes: 0
    }
  };

  /**
   * 记录请求
   */
  recordRequest(
    success: boolean,
    latency: number,
    type?: string
  ) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      if (type) {
        this.metrics.typeDistribution[type]++;
      }
    } else {
      this.metrics.failedRequests++;
    }

    // 更新平均延迟
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) 
      / this.metrics.totalRequests;
  }

  /**
   * 获取指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests
    };
  }
}
```

### 8.2 日志记录

```typescript
// lib/nlu/logger.ts

export class NLULogger {
  /**
   * 记录NLU请求
   */
  logRequest(prompt: string, intent: Intent, duration: number) {
    console.log(JSON.stringify({
      type: 'nlu_request',
      timestamp: new Date().toISOString(),
      prompt: prompt,
      intent: {
        type: intent.type,
        name: intent.name,
        fieldsCount: intent.fields?.length || 0,
        featuresCount: intent.features?.length || 0
      },
      duration: duration,
      confidence: intent.confidence
    }));
  }

  /**
   * 记录NLU错误
   */
  logError(prompt: string, error: Error) {
    console.error(JSON.stringify({
      type: 'nlu_error',
      timestamp: new Date().toISOString(),
      prompt: prompt,
      error: {
        message: error.message,
        stack: error.stack
      }
    }));
  }
}
```

---

**下一步**: 详细设计部署方案 → [06-DEPLOYMENT.md](./06-DEPLOYMENT.md)
