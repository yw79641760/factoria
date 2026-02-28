import type { VercelRequest, VercelResponse } from '@vercel/node';
import { glm5Client } from './lib/glm5-client.js';
import { Database } from './lib/database.js';
import { vercelDeployClient } from './lib/vercel-deploy.js';

/**
 * POST /api/generate
 * 生成APP的API端点
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
    const { prompt, userId, options } = req.body;

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

    // 2. 创建APP记录（状态：generating）
    const appId = `app_${Date.now()}`;
    const app = await Database.createApp({
      user_id: userId,
      prompt,
      intent: { type: 'tracker', name: 'Generating...' },  // 临时
      template: 'unknown',
      code: '',
      status: 'generating'
    });

    // 3. 能力编排（NLU + Orchestration）
    console.log(`[${new Date().toISOString()}] Orchestrating abilities for app ${app.id}`);
    const orchestration = await glm5Client.orchestrateAbilities(prompt);
    
    // 4. 更新Orchestration
    await Database.updateAppStatus(app.id, 'generating', { 
      intent: orchestration,
      abilities: orchestration.abilities 
    });

    // 5. 生成代码（基于能力编排）
    console.log(`[${new Date().toISOString()}] Generating code for app ${app.id}`);
    const code = await glm5Client.generateCode(orchestration);

    // 6. 更新代码
    await Database.updateAppStatus(app.id, 'deploying', { 
      code,
      abilities: orchestration.abilities
    });

    // 7. Vercel 部署（自动部署）
    const deploymentConfig = {
      name: app.id,
      framework: 'vite',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      files: [
        {
          file: 'index.html',
          content: `<!DOCTYPE html><html><head><title>${app.id}</title></head><body><div id="root"></div></body></html>`,
        },
        {
          file: 'package.json',
          content: JSON.stringify({
            name: app.id,
            scripts: { build: 'vite build' },
            dependencies: { react: '^19.2.0', 'react-dom': '^19.2.0' },
          }, null, 2),
        },
      ],
    };

    const deployment = await vercelDeployClient.deploy(deploymentConfig);
    const vercelUrl = deployment.url;
    
    // 8. 更新状态为ready
    await Database.updateAppStatus(app.id, 'ready', {
      vercel_url: vercelUrl,
      deploy_time: 5
    });

    // 10. 返回结果
    return res.status(200).json({
      success: true,
      data: {
        appId: app.id,
        url: vercelUrl,
        code,
        orchestration,
        abilities: orchestration.abilities,
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
