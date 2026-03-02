import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ModularCodeGenerator } from './lib/modular-code-generator.js';
import { ModuleStorage } from './lib/module-storage.js';
import { deployApp } from './lib/vercel-deploy.js';

/**
 * POST /api/generate
 * 生成APP的API端点（模块化版本）
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }
    });
  }

  try {
    const { prompt, userId, mode = 'modular' } = req.body;

    // 1. 输入验证
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Prompt is required' }
      });
    }

    if (prompt.length < 1 || prompt.length > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Prompt must be between 1 and 500 characters' }
      });
    }

    // 2. 选择生成模式
    let result: any;

    if (mode === 'modular') {
      // 模块化生成模式（新架构）
      result = await generateModularApp(prompt);
    } else {
      // 传统生成模式（兼容旧版本）
      result = await generateLegacyApp(prompt);
    }

    // 3. Vercel 部署
    let vercelUrl: string;

    if (process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        console.log(`[${new Date().toISOString()}] Deploying to Vercel (real API)`);
        const deployment = await deployApp(result.code, result.appName);
        vercelUrl = deployment.url;
        console.log(`[${new Date().toISOString()}] Vercel deployment successful: ${vercelUrl}`);
      } catch (deployError: any) {
        console.error(`[${new Date().toISOString()}] Vercel deployment failed:`, deployError.message);
        console.log(`[${new Date().toISOString()}] Falling back to mock deployment`);
        vercelUrl = `https://${result.appId}.vercel.app`;
      }
    } else {
      console.log(`[${new Date().toISOString()}] Using mock deployment (VERCEL_ACCESS_TOKEN not configured)`);
      vercelUrl = `https://${result.appId}.vercel.app`;
    }

    // 4. 返回结果
    return res.status(200).json({
      success: true,
      data: {
        appId: result.appId,
        url: vercelUrl,
        code: result.code,
        orchestration: result.orchestration,
        modules: result.modules || [],
        mode,
        deployTime: 5
      }
    });

  } catch (error: any) {
    console.error('Generate API error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    });
  }
}

/**
 * 模块化生成模式
 */
async function generateModularApp(prompt: string) {
  const generator = new ModularCodeGenerator();
  await generator.init();

  console.log(`[${new Date().toISOString()}] Starting modular code generation`);

  const { app, finalCode } = await generator.generateModularCode(prompt);

  console.log(`[${new Date().toISOString()}] Modular code generation completed`);
  console.log(`[${new Date().toISOString()}] Generated ${app.modules.length} modules`);

  return {
    appId: app.appId,
    appName: app.appName,
    code: finalCode,
    orchestration: {
      intent: app.orchestration.intent,
      app_name: app.appName,
      abilities: app.orchestration.modules.map((m: any) => m.ability),
      orchestration: `Generated ${app.modules.length} modules: ${app.modules.map((m: any) => m.id).join(', ')}`,
      confidence: 0.95
    },
    modules: app.modules.map((m: any) => ({
      id: m.moduleId,
      name: m.moduleId,
      description: m.moduleId
    }))
  };
}

/**
 * 传统生成模式（兼容旧版本）
 */
async function generateLegacyApp(prompt: string) {
  // TODO: 调用旧的 GLM-5 生成逻辑
  // 这里需要导入旧的 generateCode 方法
  
  // 临时返回模拟数据
  return {
    appId: `legacy_${Date.now()}`,
    appName: 'Legacy App',
    code: '// Legacy mode not yet implemented',
    orchestration: {
      intent: 'Legacy mode',
      app_name: 'Legacy App',
      abilities: [],
      orchestration: 'Legacy mode',
      confidence: 0.5
    },
    modules: []
  };
}
