/**
 * GLM-5 API 客户端
 * 用于需求解析和代码生成
 */

interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GLMResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GLM5Client {
  private apiKey: string;
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LLM_API_KEY!;
    
    if (!this.apiKey) {
      throw new Error('GLM_API_KEY is required');
    }
  }

  /**
   * 发送聊天请求
   */
  async chat(
    messages: GLMMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    const {
      model = 'glm-4',
      temperature = 0.7,
      maxTokens = 2000,
      topP = 0.9
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${error}`);
      }

      const data: GLMResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from GLM API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('GLM API call failed:', error);
      throw error;
    }
  }

  /**
   * 能力编排（NLU + Orchestration）
   * 根据用户意图，识别并编排需要的能力
   */
  async orchestrateAbilities(prompt: string): Promise<any> {
    const systemPrompt = `你是一个能力编排专家。

核心思想：不是选择模板，而是识别并编排需要的能力。

能力库：
数据层能力：
- storage: 数据存储和管理
- persistence: 数据持久化（localStorage）
- export: 数据导出（CSV/JSON）

UI层能力：
- form-input: 表单输入
- list-display: 列表展示
- card-display: 卡片展示
- chart: 图表可视化

交互层能力：
- add: 添加记录
- edit: 编辑记录
- delete: 删除记录
- toggle: 切换状态（完成/未完成）
- filter: 过滤数据
- sort: 排序数据

你的任务：
1. 理解用户意图
2. 识别需要的能力（从能力库中选择）
3. 按顺序编排这些能力
4. 生成完整的React代码

示例：
用户："追踪每天喝水量"
→ 意图：数据追踪
→ 需要的能力：form-input → add → storage → persistence → list-display → chart
→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、图表可视化

用户："管理待办清单"
→ 意图：任务管理
→ 需要的能力：form-input → add → storage → persistence → list-display → toggle → delete
→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、切换完成状态、删除功能

输出格式（JSON）：
{
  "intent": "用户意图描述",
  "app_name": "应用名称（2-8字）",
  "abilities": ["ability1", "ability2", ...],
  "orchestration": "编排逻辑说明"
}

只返回JSON，不要包含其他说明文字。`;

    const userMessage = `用户需求：\n"""${prompt}"""`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.5,  // 中等温度，允许一定灵活性
        maxTokens: 2000
      });

      // 解析JSON
      let jsonStr = response.trim();
      
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\n([\s\S]+?)\n```/);
        if (match) jsonStr = match[1];
      } else if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```\n([\s\S]+?)\n```/);
        if (match) jsonStr = match[1];
      }

      const orchestration = JSON.parse(jsonStr);
      
      // 验证必要字段
      if (!orchestration.intent || !orchestration.abilities) {
        throw new Error('Invalid orchestration: missing required fields');
      }

      // 添加置信度
      orchestration.confidence = 0.9;

      return orchestration;
    } catch (error) {
      console.error('Failed to orchestrate abilities:', error);
      throw new Error('Failed to orchestrate abilities');
    }
  }

  /**
   * 生成代码（基于能力编排）
   */
  async generateCode(orchestration: any): Promise<string> {
    const systemPrompt = `你是一个React代码生成专家。

基于能力编排生成完整的React应用代码。

要求：
1. 使用React 18 + TypeScript
2. 使用Tailwind CSS进行样式
3. 使用localStorage进行数据持久化
4. 代码要完整、可直接运行
5. 组件结构清晰，可维护

代码结构建议：
- 主App组件
- 状态管理（useState）
- 数据持久化（useEffect）
- UI渲染（基于编排的能力）

请生成完整的代码。`;

    const userMessage = `
能力编排结果：
${JSON.stringify(orchestration, null, 2)}

请生成完整的React应用代码。`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.7,
        maxTokens: 3000
      });

      // 提取代码
      let code = response.trim();
      
      if (code.includes('```typescript')) {
        const match = code.match(/```typescript\n([\s\S]+?)\n```/);
        if (match) code = match[1];
      } else if (code.includes('```tsx')) {
        const match = code.match(/```tsx\n([\s\S]+?)\n```/);
        if (match) code = match[1];
      } else if (code.includes('```')) {
        const match = code.match(/```\n([\s\S]+?)\n```/);
        if (match) code = match[1];
      }

      return code;
    } catch (error) {
      console.error('Failed to generate code:', error);
      throw new Error('Failed to generate code');
    }
  }

  /**
   * 生成代码（基于模板）
   */
  async generateCode(
    intent: any,
    templateCode: string
  ): Promise<string> {
    const systemPrompt = `你是一个代码生成专家。根据用户的意图和模板代码，生成完整的React应用代码。

要求：
1. 保持模板的整体结构
2. 根据意图填充具体内容
3. 确保代码可以直接运行
4. 使用Tailwind CSS样式
5. 代码质量要高`;

    const userMessage = `
用户意图：
${JSON.stringify(intent, null, 2)}

模板代码：
\`\`\`typescript
${templateCode}
\`\`\`

请生成完整的代码。`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.5,
        maxTokens: 3000
      });

      // 提取代码
      let code = response.trim();
      
      // 如果包含markdown代码块，提取内容
      if (code.includes('```typescript')) {
        const match = code.match(/```typescript\n([\s\S]+?)\n```/);
        if (match) {
          code = match[1];
        }
      } else if (code.includes('```tsx')) {
        const match = code.match(/```tsx\n([\s\S]+?)\n```/);
        if (match) {
          code = match[1];
        }
      } else if (code.includes('```')) {
        const match = code.match(/```\n([\s\S]+?)\n```/);
        if (match) {
          code = match[1];
        }
      }

      return code;
    } catch (error) {
      console.error('Failed to generate code:', error);
      throw new Error('Failed to generate code');
    }
  }
}

// 导出单例
export const glm5Client = new GLM5Client();
