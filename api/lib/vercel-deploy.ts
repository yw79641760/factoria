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

  // 构建部署请求 - 使用简化的静态文件部署
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
      console.error('Vercel API error response:', error);
      throw new Error(`Vercel API error: ${response.status} - ${error}`);
    }

    const deployment = await response.json();

    console.log('Vercel deployment response:', {
      id: deployment.id,
      url: deployment.url,
      state: deployment.readyState
    });

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
 * 从生成的代码中提取组件名称
 */
function getComponentName(appCode: string): string {
  // 尝试匹配默认导出的组件
  const defaultExportMatch = appCode.match(/export default\s+(?:function|const)\s+(\w+)/);
  if (defaultExportMatch) {
    return defaultExportMatch[1];
  }

  // 尝试匹配命名函数
  const namedFunctionMatch = appCode.match(/(?:function|const)\s+(\w+)\s*[=\(]/);
  if (namedFunctionMatch) {
    return namedFunctionMatch[1];
  }

  // 默认返回 App
  return 'App';
}

/**
 * 清理 LLM 生成的代码，使其在浏览器环境中可用
 */
export function cleanGeneratedCode(appCode: string): string {
  console.log('[cleanGeneratedCode] Input length:', appCode.length);

  let cleanCode = appCode;

  // 移除所有 import 语句
  cleanCode = cleanCode
    // 默认导入：import React from 'react'
    .replace(/import\s+React\s+from\s+['"]react['"]\s*;?\s*\n?/g, '')
    // 命名导入：import { useState, useEffect } from 'react'
    .replace(/import\s+\{[^}]+\}\s+from\s+['"]react['"]\s*;?\s*\n?/g, '')
    // react-dom 导入：import ReactDOM from 'react-dom/client'
    .replace(/import\s+ReactDOM\s+from\s+['"]react-dom[\/\\w]*['"]\s*;?\s*\n?/g, '')
    // react-dom 命名导入：import { createRoot } from 'react-dom/client'
    .replace(/import\s+\{[^}]+\}\s+from\s+['"]react-dom[\/\\w]*['"]\s*;?\s*\n?/g, '')
    // CSS 导入：import './index.css'
    .replace(/import\s+['"]\.\/[^'"]+['"]\s*;?\s*\n?/g, '')
    // 其他导入：import anything from 'anything'
    .replace(/import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*\n?/g, '');

  // 移除 export 语句
  cleanCode = cleanCode
    .replace(/export default\s+/, '')
    .replace(/export\s+/, '');

  // 移除重复的渲染代码（因为 HTML 模板中已经有了）
  // 方法：直接移除包含 root 或 ReactDOM.createRoot 的行
  const lines = cleanCode.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('const root') &&
           !trimmed.startsWith('root.render') &&
           !trimmed.startsWith('ReactDOM.createRoot');
  });
  cleanCode = filteredLines.join('\n');;

  // 移除 TypeScript 类型注解
  cleanCode = cleanCode
    // 移除泛型：useState<number>(0) → useState(0)
    .replace(/(\w+)\s*<[^>]*>/g, '$1')
    // 移除数组泛型：Array<number>[] → []
    .replace(/\[\s*\w+<[^>]*>\s*\]/g, '[]')
    // 移除类型声明：const x: string = → const x =
    .replace(/:\s*(?:string|number|boolean|any|void|null|undefined|object|Array|Function)(?=\s*[,\)=\]])/g, '')
    // 移除类型断言：as HTMLElement
    .replace(/\s+as\s+\w+(?=\s*[,\);])/g, '');

  // 移除 React.StrictMode（HTML 模板中已经有了）
  cleanCode = cleanCode
    .replace(/<React\.StrictMode>/g, '')
    .replace(/<\/React\.StrictMode>/g, '');

  // 如果代码中没有 React hooks 解构，添加它
  if (!/const\s+\{\s*useState[\s,]*useEffect/.test(cleanCode) && /useState|useEffect/.test(cleanCode)) {
    cleanCode = `const { useState, useEffect } = React;\n\n${cleanCode}`;
  }

  console.log('[cleanGeneratedCode] Output length:', cleanCode.length);
  console.log('[cleanGeneratedCode] Has import React:', cleanCode.includes('import React'));
  console.log('[cleanGeneratedCode] Has root.render:', cleanCode.includes('root.render'));

  return cleanCode.trim();
}

/**
 * 生成 HTML 文件（基于生成的代码）
 */
export function generateHtmlFile(
  appCode: string,
  appName: string = 'My App'
): string {
  // 清理代码
  const cleanCode = cleanGeneratedCode(appCode);

  // 提取组件名称
  const componentName = getComponentName(appCode);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - Factoria</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- React and ReactDOM -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Babel for JSX transformation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
    <div id="app"></div>
    <script type="text/babel">
        ${cleanCode}

        // 自动渲染组件（如果代码中没有渲染逻辑）
        if (!cleanCode.includes('ReactDOM.createRoot') && !cleanCode.includes('root.render')) {
            const root = ReactDOM.createRoot(document.getElementById('app'));
            root.render(<React.StrictMode><App /></React.StrictMode>);
        }
    </script>
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

  console.log('HTML file length:', htmlContent.length);

  // 创建部署 - 只上传 index.html
  return await createDeployment({
    files: [
      {
        file: 'index.html',
        data: htmlContent,
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
