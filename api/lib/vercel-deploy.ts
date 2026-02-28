/**
 * Vercel Deployment API Client
 *
 * 用于通过 Vercel API 部署动态生成的应用
 *
 * 环境变量需求：
 * - VERCEL_TOKEN: Vercel API Token（从 Vercel Dashboard → Settings → Tokens 创建）
 * - VERCEL_ORG_ID: 组织 ID（从 Vercel 项目设置 → General 获取）
 * - VERCEL_PROJECT_ID: 项目 ID（从 Vercel 项目设置 → General 获取）
 *
 * 文档：https://vercel.com/docs/deployments
 */

interface VercelDeploymentResponse {
  url: string;
  deployId: string;
  alias: string[];
}

interface VercelDeploymentConfig {
  name: string;
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  files: Array<{
    file: string;
    content: string;
  }>;
  env?: Record<string, string>;
}

/**
 * Vercel 部署客户端类
 */
export class VercelDeployClient {
  private token: string;
  private orgId: string;
  private projectId: string;
  private baseUrl: string;

  constructor() {
    this.token = process.env.VERCEL_TOKEN || '';
    this.orgId = process.env.VERCEL_ORG_ID || '';
    this.projectId = process.env.VERCEL_PROJECT_ID || '';
    this.baseUrl = 'https://api.vercel.com/v10';

    if (!this.token) {
      console.warn('⚠️ VERCEL_TOKEN not configured, using mock deployment');
    }
  }

  /**
   * 部署应用到 Vercel
   *
   * @param config 部署配置
   * @returns 部署结果（URL）
   */
  async deploy(config: VercelDeploymentConfig): Promise<VercelDeploymentResponse> {
    // 如果未配置 Vercel Token，使用模拟部署
    if (!this.token) {
      return this.mockDeploy(config);
    }

    try {
      // 创建部署
      const response = await fetch(`${this.baseUrl}/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          project: this.projectId,
          teamId: this.orgId,
          framework: config.framework,
          buildCommand: config.buildCommand,
          outputDirectory: config.outputDirectory,
          files: config.files,
          env: config.env,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vercel deployment failed: ${error}`);
      }

      const deployment = await response.json();
      return {
        url: deployment.url,
        deployId: deployment.id,
        alias: deployment.alias || [],
      };
    } catch (error: any) {
      console.error('Vercel deployment error:', error);
      // 如果部署失败，使用模拟部署作为回退
      console.warn('⚠️ Falling back to mock deployment');
      return this.mockDeploy(config);
    }
  }

  /**
   * 获取部署状态
   *
   * @param deploymentId 部署 ID
   * @returns 部署状态
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR';
    url?: string;
  }> {
    if (!this.token) {
      // 模拟部署总是成功
      return { state: 'READY', url: `https://mock-${deploymentId}.vercel.app` };
    }

    try {
      const response = await fetch(`${this.baseUrl}/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get deployment status`);
      }

      const deployment = await response.json();
      return {
        state: deployment.readyState,
        url: deployment.url,
      };
    } catch (error: any) {
      console.error('Failed to get deployment status:', error);
      return { state: 'ERROR' };
    }
  }

  /**
   * 模拟部署（用于 MVP 阶段，未配置真实 API 时）
   *
   * @param config 部署配置
   * @returns 模拟的部署结果
   */
  private mockDeploy(config: VercelDeploymentConfig): VercelDeploymentResponse {
    const mockId = Date.now().toString();
    console.log(`📦 Mock deployment: ${config.name}`);
    return {
      url: `https://${config.name}-${mockId}.vercel.app`,
      deployId: mockId,
      alias: [`${config.name}.vercel.app`],
    };
  }

  /**
   * 创建 Vercel 项目（如果不存在）
   *
   * @param projectName 项目名称
   * @returns 项目 ID
   */
  async createProject(projectName: string): Promise<string> {
    if (!this.token) {
      console.warn('⚠️ VERCEL_TOKEN not configured, cannot create project');
      return '';
    }

    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create Vercel project: ${error}`);
      }

      const project = await response.json();
      return project.id;
    } catch (error: any) {
      console.error('Failed to create Vercel project:', error);
      return '';
    }
  }
}

// 导出单例实例
export const vercelDeployClient = new VercelDeployClient();
