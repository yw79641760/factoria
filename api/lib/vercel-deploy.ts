/**
 * Vercel Deployment Helper
 * 使用 Vercel REST API 动态部署生成的 APP 代码
 */

interface VercelDeploymentOptions {
  files: Array<{
    file: string;
    data: string;
    encoding?: 'utf-8' | 'base64';
  }>;
  projectName?: string;
  environmentVariables?: Record<string, string>;
}

interface VercelDeploymentResponse {
  url: string;
  deployId: string;
  deployUrl: string;
  state: string;
}

/**
 * 创建 Vercel 部署
 */
export async function createDeployment(
  options: VercelDeploymentOptions
): Promise<VercelDeploymentResponse> {
  const {
    files,
    projectName = process.env.VERCEL_PROJECT_NAME || 'factoria-app',
    environmentVariables = {}
  } = options;

  // 从环境变量获取配置
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!accessToken) {
    throw new Error('VERCEL_ACCESS_TOKEN is not configured');
  }

  if (!projectId) {
    throw new Error('VERCEL_PROJECT_ID is not configured');
  }

  // 构建部署请求
  const deploymentPayload = {
    name: `app_${Date.now()}`,
    project: projectId,
    target: 'production',
    files: files.map(f => ({
      file: f.file,
      data: f.data,
      encoding: f.encoding || 'utf-8'
    })),
    env: environmentVariables
  };

  try {
    // 发送部署请求
    const response = await fetch(
      `https://api.vercel.com/v13/deployments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentPayload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${response.status} - ${error}`);
    }

    const deployment = await response.json();

    return {
      url: deployment.url || `https://${deployment.name}.vercel.app`,
      deployId: deployment.id || '',
      deployUrl: deployment.deployUrl || '',
      state: deployment.readyState || ''
    };
  } catch (error: any) {
    console.error('Vercel deployment error:', error);
    throw error;
  }
}

/**
 * 生成 HTML 文件（基于生成的代码）
 */
export function generateHtmlFile(
  appCode: string,
  appName: string = 'My App'
): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - Factoria</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-white mb-8">${appName}</h1>
        <div id="app"></div>
        <script>
            ${appCode}
        </script>
    </div>
</body>
</html>`;
}

/**
 * 部署生成的 APP 到 Vercel
 */
export async function deployApp(
  appCode: string,
  appName: string = 'My App'
): Promise<VercelDeploymentResponse> {
  // 生成 HTML 文件
  const htmlContent = generateHtmlFile(appCode, appName);

  // 创建部署
  return await createDeployment({
    files: [
      {
        file: 'index.html',
        data: htmlContent,
        encoding: 'utf-8'
      },
      {
        file: 'vercel.json',
        data: JSON.stringify({
          version: 2,
          builds: [
            {
              src: 'index.html',
              use: '@vercel/static'
            }
          ],
          routes: [
            {
              src: '/(.*)',
              dest: '/index.html'
            }
          ]
        }, null, 2),
        encoding: 'utf-8'
      }
    ]
  });
}

/**
 * 获取部署状态
 */
export async function getDeploymentStatus(
  deployId: string
): Promise<{ state: string; url?: string }> {
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('VERCEL_ACCESS_TOKEN is not configured');
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${deployId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    const deployment = await response.json();

    return {
      state: deployment.readyState || '',
      url: deployment.url || ''
    };
  } catch (error: any) {
    console.error('Get deployment status error:', error);
    throw error;
  }
}
