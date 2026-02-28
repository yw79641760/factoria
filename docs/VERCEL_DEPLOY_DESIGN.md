# Vercel 自动部署设计文档

## 目标

为 Factoria 提供真实 APP 部署功能，从想法到可用 URL < 30 秒。

## MVP 阶段：使用 Deploy Hooks

### 设计思路

**最简方案**：使用 Vercel Deploy Hooks

**原理**：
1. 用户在 Vercel 创建项目
2. 连接 GitHub 仓库
3. 生成 Deploy Hook URL
4. 配置到 Factoria 环境变量
5. Factoria 触发部署时，发送请求到 Deploy Hook URL

### 实现步骤

#### 步骤 1：环境变量配置

```env
# configs/.env
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
VERCEL_PROJECT_ID=prj_xxxxxxx
```

#### 步骤 2：API 更新

创建 `api/lib/vercel-client.ts`：

```typescript
export async function triggerVercelDeployment(): Promise<{
  url: string;
  deployTime: number;
}> {
  const startTime = Date.now();

  // 触发 Deploy Hook
  const response = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger deployment: ${response.statusText}`);
  }

  // 等待部署完成（简单轮询）
  const deployUrl = await pollDeploymentReady();

  const deployTime = (Date.now() - startTime) / 1000;

  return {
    url: deployUrl,
    deployTime,
  };
}

async function pollDeploymentReady(): Promise<string> {
  const maxAttempts = 30; // 30秒超时
  const interval = 1000; // 1秒检查一次

  for (let i = 0; i < maxAttempts; i++) {
    // 简化：直接返回预设 URL
    // 实际部署应该轮询 Vercel API 获取部署状态
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return `https://${process.env.VERCEL_PROJECT_ID}.vercel.app`;
}
```

更新 `api/generate-real.ts`：

```typescript
// 替换模拟部署为真实部署
const deployTime = Date.now();

try {
  const deployment = await triggerVercelDeployment();
  vercelUrl = deployment.url;
  deployTime = deployment.deployTime;
} catch (error) {
  console.error('Deployment failed:', error);
  // 降级到模拟 URL
  vercelUrl = `https://${app.id}.vercel.app`;
}
```

### 用户体验流程

**用户配置（一次性）**：
1. 访问 https://vercel.com
2. 创建新项目 "factoria-apps"
3. 连接 GitHub 仓库（或创建空仓库）
4. 进入项目设置 → Integrations → Deploy Hooks
5. 复制 Deploy Hook URL
6. 配置到 Factoria 环境变量

**生成 APP**：
1. 用户输入需求
2. Factoria 生成代码
3. Factoria 推送代码到 GitHub（或更新文件）
4. Factoria 触发 Deploy Hook
5. 等待 Vercel 部署完成
6. 返回真实 URL

### 优缺点

**优点**：
- ✅ 实现简单
- ✅ 不需要上传文件
- ✅ Vercel 自动处理构建
- ✅ 可以使用 Git 集成的所有功能

**缺点**：
- ⚠️ 需要用户预先配置
- ⚠️ 依赖 GitHub 集成
- ⚠️ 需要推送代码到仓库

## 成长期：使用 Vercel REST API

### 设计思路

**完整方案**：使用 Vercel REST API

**原理**：
1. 生成 APP 代码
2. 上传文件到 Vercel
3. 创建部署
4. 轮询部署状态
5. 返回真实 URL

### 实现步骤

#### 步骤 1：API Token 配置

```env
# configs/.env
VERCEL_API_TOKEN=...
VERCEL_TEAM_ID=...
```

#### 步骤 2：完整部署实现

```typescript
export async function createVercelDeployment(
  code: string,
  appId: string
): Promise<{
  url: string;
  deployTime: number;
}> {
  const startTime = Date.now();

  // 1. 创建项目（如果不存在）
  const project = await createProject(`factoria-${appId}`);

  // 2. 上传文件
  const files = await uploadFiles(project.id, code);

  // 3. 创建部署
  const deployment = await createDeployment(project.id, files);

  // 4. 轮询部署状态
  await pollDeploymentStatus(deployment.id);

  const deployTime = (Date.now() - startTime) / 1000;

  return {
    url: deployment.url,
    deployTime,
  };
}
```

### 优缺点

**优点**：
- ✅ 完全自动化
- ✅ 不依赖 GitHub
- ✅ 无需用户配置
- ✅ 更快的部署速度

**缺点**：
- ⚠️ 实现复杂
- ⚠️ 需要管理文件上传
- ⚠️ 需要处理构建错误

## 推荐方案

### MVP 阶段（现在）

**选择**：Deploy Hooks

**原因**：
1. 实现简单，快速上线
2. 用户体验：一次性配置，多次使用
3. 技术风险低
4. 可以快速验证部署流程

**实施优先级**：P0

### 成长期（未来）

**选择**：Vercel REST API

**原因**：
1. 完全自动化，无需用户配置
2. 更好的用户体验
3. 支持多租户
4. 符合"一句话APP工厂"的理念

**实施优先级**：P1

## 实施计划

### 阶段 1：MVP（Deploy Hooks）

**工作量**：~2 小时

**任务**：
- [ ] 创建 `api/lib/vercel-client.ts`
- [ ] 实现 Deploy Hook 触发
- [ ] 更新 `api/generate-real.ts` 集成
- [ ] 添加环境变量验证
- [ ] 编写配置文档
- [ ] 测试部署流程

**文档**：
- `VERCEL_DEPLOY_SETUP.md` - 用户配置指南
- `api/lib/vercel-client.ts` - Vercel 客户端
- 更新 `SETUP_LLM_API_KEY.md` - 添加 Deploy Hooks 配置

### 阶段 2：成长期（REST API）

**工作量**：~8 小时

**任务**：
- [ ] 研究 Vercel REST API 文档
- [ ] 实现文件上传
- [ ] 实现部署创建
- [ ] 实现状态轮询
- [ ] 错误处理和重试
- [ ] 性能优化

## 成本估算

### Deploy Hooks（MVP）

- Vercel 免费额度：足够
- 无额外成本
- 依赖 GitHub 免费

### REST API（成长期）

- Vercel 免费额度：足够
- API Token：免费
- 文件存储：使用 Vercel 免费额度

## 性能目标

### MVP 阶段

- 部署时间：< 60 秒（包含 Git 推送 + Vercel 构建）
- 成功率：> 95%
- 降级方案：返回模拟 URL

### 成长期

- 部署时间：< 30 秒
- 成功率：> 99%
- 无降级方案

---

**最后更新**：2026-02-28
