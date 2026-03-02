/**
 * Modular Code Generator - 基于多轮对话的模块化代码生成
 * 
 * 流程：
 * 1. 意图感知（LLM）
 * 2. 需求拆解（LLM）
 * 3. 模块化代码生成（每轮对话生成一个模块）
 * 4. 模块整合（LLM）
 * 5. 调试验证
 */

import { ModuleStorage, Module, App } from './module-storage.js';
import { GLM5Client } from './glm5-client.js';

export interface ModuleGenerationResult {
  moduleId: string;
  code: string;
  dependencies: string[];
  exports: string[];
  description: string;
}

export interface OrchestrationResult {
  intent: string;
  appName: string;
  modules: Array<{
    id: string;
    name: string;
    ability: string;
    description: string;
  }>;
  dependencies: Record<string, string[]>; // 模块间的依赖关系
}

export class ModularCodeGenerator {
  private glmClient: GLM5Client;
  private moduleStorage: ModuleStorage;

  constructor() {
    this.glmClient = new GLM5Client();
    this.moduleStorage = new ModuleStorage();
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    await this.moduleStorage.init();
  }

  /**
   * 步骤 1：意图感知
   * 分析用户意图，用户当前状态，用户习惯
   */
  async analyzeIntent(prompt: string): Promise<string> {
    const systemPrompt = `你是一个意图分析专家。

任务：分析用户需求，提取核心意图和上下文信息。

输出格式（JSON）：
{
  "intent": "用户的核心意图",
  "context": "用户可能的使用场景",
  "requirements": ["具体需求1", "具体需求2"]
}

只返回 JSON，不要包含其他说明文字。`;

    const userMessage = `用户需求：\n"""${prompt}"""`;

    const response = await this.glmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.5,
      maxTokens: 500
    });

    const jsonStr = this.extractJson(response);
    const result = JSON.parse(jsonStr);
    
    console.log(`[ModularCodeGenerator] Intent: ${result.intent}`);
    return result.intent;
  }

  /**
   * 步骤 2：需求拆解
   * 将用户需求拆分成小的逻辑单元，每个单元对应一个 Ability
   */
  async decomposeRequirements(prompt: string, intent: string): Promise<OrchestrationResult> {
    const systemPrompt = `你是一个需求拆解专家。

任务：将用户需求拆分成小的逻辑单元（模块），每个单元对应一个 Ability。

能力库：
- form-input: 表单输入
- storage: 数据存储
- persistence: 数据持久化（localStorage）
- list-display: 列表展示
- card-display: 卡片展示
- add: 添加记录
- edit: 编辑记录
- delete: 删除记录
- toggle: 切换状态
- filter: 过滤数据
- sort: 排序数据
- chart: 图表可视化
- export: 数据导出

拆解原则：
1. 将复杂需求分解为独立的功能模块
2. 每个模块应该职责单一，易于复用
3. 确定模块间的依赖关系
4. 模块之间通过接口进行交互

输出格式（JSON）：
{
  "intent": "用户意图",
  "appName": "应用名称（2-8字）",
  "modules": [
    {
      "id": "模块ID（小写，如 "storage", "form-input"）",
      "name": "模块名称",
      "ability": "对应的能力",
      "description": "模块功能描述"
    }
  ],
  "dependencies": {
    "模块ID": ["依赖的模块ID1", "依赖的模块ID2"]
  }
}

只返回 JSON，不要包含其他说明文字。`;

    const userMessage = `
用户需求：
"""${prompt}"""

意图分析：
${intent}

请进行需求拆解。`;

    const response = await this.glmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.5,
      maxTokens: 1500
    });

    const jsonStr = this.extractJson(response);
    const result: OrchestrationResult = JSON.parse(jsonStr);
    
    console.log(`[ModularCodeGenerator] Decomposed into ${result.modules.length} modules`);
    return result;
  }

  /**
   * 步骤 3：模块化代码生成
   * 为每个模块生成代码，存储到 IndexedDB
   */
  async generateModules(
    appId: string,
    orchestration: OrchestrationResult
  ): Promise<Module[]> {
    const modules: Module[] = [];

    // 为每个模块生成代码
    for (const moduleConfig of orchestration.modules) {
      console.log(`[ModularCodeGenerator] Generating module: ${moduleConfig.id}`);

      const moduleCode = await this.generateModuleCode(
        moduleConfig,
        orchestration.modules,
        orchestration.dependencies
      );

      const module: Module = {
        id: `${appId}_${moduleConfig.id}`,
        appId,
        moduleId: moduleConfig.id,
        code: moduleCode.code,
        dependencies: orchestration.dependencies[moduleConfig.id] || [],
        exports: moduleCode.exports,
        timestamp: Date.now()
      };

      // 存储到 IndexedDB
      await this.moduleStorage.saveModule(module);
      modules.push(module);
    }

    return modules;
  }

  /**
   * 为单个模块生成代码
   */
  private async generateModuleCode(
    moduleConfig: any,
    allModules: any[],
    dependencies: Record<string, string[]>
  ): Promise<ModuleGenerationResult> {
    const systemPrompt = `你是一个 React 模块代码生成专家。

任务：为指定的模块生成 React 代码，该模块将直接嵌入到浏览器的 script 标签中。

【重要】代码格式要求：
1. **不要使用 TypeScript**，生成纯 JavaScript
2. **不要使用 import 语句**
3. **不要使用 export 语句**
4. **直接使用 React 全局变量**
5. 第一行：const { useState, useEffect } = React;

模块信息：
- 模块ID：${moduleConfig.id}
- 模块名称：${moduleConfig.name}
- 模块能力：${moduleConfig.ability}
- 功能描述：${moduleConfig.description}

依赖模块：
${dependencies[moduleConfig.id] ? dependencies[moduleConfig.id].map((d: string) => `- ${d}`).join('\n') : '无'}

代码要求：
1. 定义函数或变量，作为模块的对外接口
2. 如果依赖其他模块，假设这些模块的函数/变量已经存在
3. 使用 localStorage 进行数据持久化
4. 使用 Tailwind CSS 进行样式
5. 代码要简洁、清晰

输出格式（JSON）：
{
  "code": "完整的模块代码",
  "dependencies": ["依赖的模块ID列表"],
  "exports": ["对外暴露的函数/变量列表"],
  "description": "模块功能说明"
}

只返回 JSON，不要包含代码块标记。`;

    const userMessage = `请为模块 "${moduleConfig.name}" 生成代码。`;

    const response = await this.glmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.7,
      maxTokens: 2000
    });

    const jsonStr = this.extractJson(response);
    return JSON.parse(jsonStr);
  }

  /**
   * 步骤 4：模块整合
   * 将所有模块整合成完整的 React 应用
   */
  async integrateModules(appId: string, orchestration: OrchestrationResult): Promise<string> {
    // 从 IndexedDB 读取所有模块
    const modules = await this.moduleStorage.getModules(appId);

    const systemPrompt = `你是一个 React 模块整合专家。

任务：将多个模块整合成完整的 React 应用代码。

模块列表：
${modules.map(m => `
- 模块ID：${m.moduleId}
- 对外接口：${m.exports.join(', ') || '无'}
- 依赖：${m.dependencies.join(', ') || '无'}
`).join('\n')}

整合要求：
1. 创建主 App 组件
2. 使用 React hooks 管理状态
3. 调用各模块的函数/变量
4. 使用 localStorage 进行数据持久化
5. 使用 Tailwind CSS 进行样式
6. 确保模块间的调用关系正确

【重要】代码格式要求：
1. **不要使用 TypeScript**，生成纯 JavaScript
2. **不要使用 import 语句**
3. **不要使用 export 语句**
4. **直接使用 React 全局变量**
5. 第一行：const { useState, useEffect } = React;

输出格式：只返回完整的 React 代码（不包含 JSON 包裹，不包含代码块标记）。`;

    const userMessage = `
应用名称：${orchestration.appName}
用户需求：${orchestration.intent}

请整合所有模块，生成完整的 React 应用代码。`;

    const response = await this.glmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.7,
      maxTokens: 3000
    });

    const finalCode = this.extractCode(response);
    
    console.log(`[ModularCodeGenerator] Final code generated (${finalCode.length} chars)`);
    return finalCode;
  }

  /**
   * 完整的模块化代码生成流程
   */
  async generateModularCode(prompt: string): Promise<{
    app: App;
    finalCode: string;
  }> {
    const appId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 步骤 1：意图感知
    const intent = await this.analyzeIntent(prompt);

    // 步骤 2：需求拆解
    const orchestration = await this.decomposeRequirements(prompt, intent);

    // 步骤 3：模块化代码生成
    const modules = await this.generateModules(appId, orchestration);

    // 步骤 4：模块整合
    const finalCode = await this.integrateModules(appId, orchestration);

    // 步骤 5：保存应用信息
    const app: App = {
      appId,
      appName: orchestration.appName,
      prompt,
      modules,
      orchestration,
      finalCode,
      timestamp: Date.now()
    };

    await this.moduleStorage.saveApp(app);

    return { app, finalCode };
  }

  /**
   * 步骤 6：调试验证（预留接口）
   */
  async validateCode(appId: string): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // TODO: 实现代码验证逻辑
    // 可以使用 Babel standalone 在 Node.js 中转译代码，检查语法错误
    return {
      success: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * 辅助方法：提取 JSON 字符串
   */
  private extractJson(text: string): string {
    let jsonStr = text.trim();

    if (jsonStr.includes('```json')) {
      const match = jsonStr.match(/```json\n([\s\S]+?)\n```/);
      if (match) jsonStr = match[1];
    } else if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```\n([\s\S]+?)\n```/);
      if (match) jsonStr = match[1];
    }

    return jsonStr;
  }

  /**
   * 辅助方法：提取代码块内容
   */
  private extractCode(text: string): string {
    let code = text.trim();

    if (code.includes('```javascript')) {
      const match = code.match(/```javascript\n([\s\S]+?)\n```/);
      if (match) code = match[1];
    } else if (code.includes('```')) {
      const match = code.match(/```\n([\s\S]+?)\n```/);
      if (match) code = match[1];
    }

    return code;
  }
}
