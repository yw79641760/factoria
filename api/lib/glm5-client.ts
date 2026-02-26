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
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v3/model-api';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GLM_API_KEY!;
    
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
      const response = await fetch(`${this.baseUrl}/${model}/chat/completions`, {
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
   * 解析用户需求（NLU）
   */
  async parseIntent(prompt: string): Promise<any> {
    const systemPrompt = `你是一个APP需求解析专家。请分析用户的需求，提取以下信息：

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

请以JSON格式返回结果，不要包含其他说明文字。`;

    const userMessage = `用户需求：\n"""${prompt}"""`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ], {
        temperature: 0.3,  // 低温度，更确定的输出
        maxTokens: 1000
      });

      // 尝试解析JSON
      let jsonStr = response.trim();
      
      // 如果包含markdown代码块，提取内容
      if (jsonStr.includes('```json')) {
        const match = jsonStr.match(/```json\n([\s\S]+?)\n```/);
        if (match) {
          jsonStr = match[1];
        }
      } else if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```\n([\s\S]+?)\n```/);
        if (match) {
          jsonStr = match[1];
        }
      }

      const intent = JSON.parse(jsonStr);
      
      // 验证必要字段
      if (!intent.type || !intent.name) {
        throw new Error('Invalid intent: missing required fields');
      }

      // 添加置信度
      intent.confidence = 0.9;

      return intent;
    } catch (error) {
      console.error('Failed to parse intent:', error);
      throw new Error('Failed to parse user intent');
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
