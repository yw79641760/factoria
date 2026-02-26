# Factoria 部署方案设计

## 文档信息
- **版本**: 1.0
- **创建日期**: 2026-02-25
- **维护者**: Factoria Team
- **状态**: 🚧 设计中

## 1. 部署架构概述

### 1.1 核心组件

Factoria 采用 **Serverless 架构**，主要组件包括：

```
┌─────────────────────────────────────────────────────────────┐
│                    用户浏览器                                 │
│  React SPA (Vercel CDN)                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel Edge Network                         │
│  ├─ 静态资源 (React App)                                     │
│  ├─ Serverless Functions (/api/*)                           │
│  └─ 自动全球CDN                                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────┐
             │                 │
             ▼                 ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│  GLM-5 API           │  │  Supabase                        │
│  (LLM调用)           │  │  ├─ PostgreSQL (数据存储)        │
└──────────────────────┘  │  ├─ Auth (认证，未来)            │
                          │  └─ Storage (文件存储，未来)     │
                          └──────────────────────────────────┘
```

### 1.2 部署平台选择

| 组件 | 平台 | 理由 |
|------|------|------|
| **前端应用** | Vercel | 自动CDN、Serverless、免费额度 |
| **API** | Vercel Serverless | 与前端同平台、低延迟 |
| **数据库** | Supabase | PostgreSQL、免费额度、易扩展 |
| **LLM** | GLM-5 (智谱AI) | 中文强、成本低、API稳定 |
| **监控** | Vercel Analytics + Supabase Dashboard | 内置、免费 |

### 1.3 部署策略

**多环境部署**：

1. **开发环境 (Development)**
   - 本地开发：`http://localhost:5173`
   - 本地API：`http://localhost:3000`
   - 用途：快速迭代、功能测试

2. **预览环境 (Preview)**
   - URL: `https://factoria-preview.vercel.app`
   - 触发：每个PR自动部署
   - 用途：团队测试、集成验证

3. **生产环境 (Production)**
   - URL: `https://factoria.app`
   - 触发：main分支合并
   - 用途：用户访问

## 2. Vercel 部署配置

### 2.1 项目结构

```
factoria/
├── web/                    # 前端应用
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── api/                    # Serverless Functions
│   ├── generate.ts
│   └── health.ts
├── vercel.json             # Vercel配置
├── package.json            # Monorepo根
└── .env.example            # 环境变量模板
```

### 2.2 vercel.json 配置

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "web/dist",
  "framework": "vite",
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/web/$1"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "GLM_API_KEY": "@glm_api_key"
  },
  "build": {
    "env": {
      "NODE_VERSION": "18"
    }
  },
  "regions": ["hkg1", "sin1"],
  "github": {
    "silent": true
  }
}
```

### 2.3 环境变量配置

#### Vercel Dashboard配置

1. 进入项目设置 → Environment Variables
2. 添加以下变量：

| 变量名 | 环境 | 值 | 说明 |
|--------|------|---|------|
| `SUPABASE_URL` | Production, Preview, Development | `https://xxx.supabase.co` | Supabase项目URL |
| `SUPABASE_ANON_KEY` | Production, Preview, Development | `eyJhbGc...` | Supabase公开密钥 |
| `GLM_API_KEY` | Production, Preview, Development | `xxx.xxx.xxx` | GLM-5 API密钥 |

#### 本地开发配置

```bash
# .env.local (不提交到Git)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GLM_API_KEY=your-glm-api-key

# Vercel CLI会自动读取.env.local
vercel dev
```

### 2.4 部署命令

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 首次部署（链接项目）
vercel

# 部署到预览环境
vercel --target preview

# 部署到生产环境
vercel --target production

# 查看部署状态
vercel ls

# 查看部署日志
vercel logs [deployment-url]
```

## 3. Supabase 配置

### 3.1 项目创建

1. **访问 Supabase**: https://supabase.com
2. **创建新项目**:
   - 项目名称: `factoria`
   - 数据库密码: (自动生成，保存好)
   - 区域: `Southeast Asia (Singapore)`
3. **获取连接信息**:
   - Settings → API → URL
   - Settings → API → anon public key

### 3.2 数据库表创建

```sql
-- 在 Supabase SQL Editor 中执行

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建apps表
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  prompt TEXT NOT NULL,
  intent JSONB NOT NULL,
  template VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  vercel_url VARCHAR(255),
  vercel_project_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'generating',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deploy_time INTEGER,
  error TEXT,
  metadata JSONB,
  
  CONSTRAINT valid_prompt CHECK (LENGTH(prompt) >= 1 AND LENGTH(prompt) <= 500)
);

-- 创建索引
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_created_at ON apps(created_at DESC);
CREATE INDEX idx_apps_intent_type ON apps USING GIN ((intent->'type'));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入测试数据（可选）
INSERT INTO apps (prompt, intent, template, code, vercel_url, status)
VALUES 
  ('测试追踪APP', '{"type":"tracker","name":"测试"}', 'tracker', '// test', 'https://test.vercel.app', 'ready');
```

### 3.3 Row Level Security (RLS)

```sql
-- 启用RLS
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取（MVP阶段）
CREATE POLICY "Allow all read access"
  ON apps FOR SELECT
  USING (true);

-- 允许所有用户插入（MVP阶段）
CREATE POLICY "Allow all insert access"
  ON apps FOR INSERT
  WITH CHECK (true);

-- 允许所有用户更新（MVP阶段）
CREATE POLICY "Allow all update access"
  ON apps FOR UPDATE
  USING (true);
```

### 3.4 API密钥管理

**安全最佳实践**：

1. **anon key**: 公开密钥，可在前端使用
   - ✅ 只读权限（RLS保护）
   - ✅ 可以插入数据（RLS控制）

2. **service_role key**: 服务密钥，仅后端使用
   - ⚠️ 绕过RLS，完全权限
   - ⚠️ **永远不要暴露到前端**

```typescript
// 后端代码使用service_role key
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 仅后端
);

// 前端代码使用anon key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!  // 公开安全
);
```

## 4. CI/CD 流程

### 4.1 GitHub Actions 配置

```yaml
# .github/workflows/deploy.yml

name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          GLM_API_KEY: ${{ secrets.GLM_API_KEY }}

      - name: Build
        run: npm run build

      - name: Deploy to Vercel (Preview)
        if: github.event_name == 'pull_request'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Deploy to Vercel (Production)
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Comment PR with deployment URL
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.deploy.outputs.preview-url }}'
            })
```

### 4.2 GitHub Secrets配置

在GitHub仓库设置中添加以下Secrets：

| Secret名称 | 获取方式 | 说明 |
|-----------|---------|------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens | Vercel API令牌 |
| `VERCEL_ORG_ID` | Vercel项目设置 → General | 组织ID |
| `VERCEL_PROJECT_ID` | Vercel项目设置 → General | 项目ID |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | Supabase URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | 公开密钥 |
| `GLM_API_KEY` | 智谱AI开放平台 | GLM-5 API密钥 |

### 4.3 部署流程图

```
开发者推送代码
    ↓
GitHub接收Push事件
    ↓
触发GitHub Actions
    ├─ Checkout代码
    ├─ 安装依赖
    ├─ 运行测试
    └─ 构建项目
    ↓
测试通过？
    ├─ 是 → 部署到Vercel
    │         ├─ PR → Preview环境
    │         └─ main → Production环境
    └─ 否 → 失败通知
    ↓
部署成功
    ├─ 生成URL
    ├─ PR评论URL
    └─ 通知团队
```

## 5. 监控与日志

### 5.1 Vercel Analytics

**启用方式**：
1. Vercel项目设置 → Analytics
2. 启用Web Analytics
3. 自动收集以下指标：
   - 页面访问量
   - 响应时间
   - 错误率
   - 地理分布

### 5.2 函数日志

```typescript
// 在Serverless Function中记录日志

export default async function handler(req: Request, res: Response) {
  console.log(`[${new Date().toISOString()}] Request received`);
  
  try {
    // 处理逻辑
    console.log(`Processing prompt: ${req.body.prompt}`);
    
    const result = await processRequest(req.body);
    
    console.log(`[${new Date().toISOString()}] Request completed`);
    return res.json(result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
```

**查看日志**：
```bash
# 实时查看日志
vercel logs [deployment-url] --follow

# 查看历史日志
vercel logs [deployment-url] --since 1h
```

### 5.3 错误追踪

**集成Sentry（可选）**：

```typescript
// api/_lib/sentry.ts

import * as Sentry from '@sentry/serverless';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export const withSentry = (handler: Function) => {
  return Sentry.GCPFunction.wrapHandler(handler);
};

// 使用
import { withSentry } from './_lib/sentry';

export default withSentry(async function handler(req, res) {
  // 你的代码
});
```

### 5.4 性能监控

**关键指标**：

| 指标 | 目标值 | 监控方式 |
|------|--------|---------|
| **API响应时间** | < 3秒 | Vercel Analytics |
| **页面加载时间** | < 1秒 | Vercel Analytics |
| **错误率** | < 5% | Vercel Logs |
| **数据库查询时间** | < 100ms | Supabase Dashboard |

**告警规则**：
- API响应时间 > 5秒 → 邮件告警
- 错误率 > 10% → 立即告警
- 数据库连接失败 → 紧急告警

## 6. 扩展部署方案

### 6.1 自定义域名配置

1. **添加域名**：
   - Vercel项目设置 → Domains
   - 添加: `factoria.app`, `www.factoria.app`

2. **DNS配置**：
   ```
   A     factoria.app        76.76.21.21
   CNAME www.factoria.app    cname.vercel-dns.com
   ```

3. **SSL证书**：
   - Vercel自动配置Let's Encrypt证书
   - 自动续期

### 6.2 多区域部署

**Vercel Edge Network**自动全球分布，但可以优化：

```json
// vercel.json
{
  "regions": ["hkg1", "sin1", "nrt1", "sfo1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**区域代码**：
- `hkg1`: 香港
- `sin1`: 新加坡
- `nrt1`: 东京
- `sfo1`: 旧金山

### 6.3 蓝绿部署（未来）

```yaml
# .github/workflows/blue-green-deploy.yml

name: Blue-Green Deployment

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: vercel --target staging --token ${{ secrets.VERCEL_TOKEN }}
      
      - name: Run E2E Tests
        run: npm run test:e2e
      
      - name: Switch Traffic
        if: success()
        run: |
          # 切换流量到新版本
          vercel alias set $STAGING_URL $PRODUCTION_URL --token ${{ secrets.VERCEL_TOKEN }}
```

### 6.4 回滚策略

**快速回滚**：

```bash
# 查看最近的部署
vercel ls

# 回滚到上一个版本
vercel rollback [previous-deployment-url]

# 或者使用CLI
vercel --target production --force
```

**自动化回滚**：

```yaml
# .github/workflows/auto-rollback.yml

name: Auto Rollback on High Error Rate

on:
  schedule:
    - cron: '*/5 * * * *'  # 每5分钟检查一次

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check error rate
        id: check
        run: |
          ERROR_RATE=$(curl -s https://api.vercel.com/v1/deployments/${{ secrets.VERCEL_PROJECT_ID }}/events | jq '.error_rate')
          echo "::set-output name=error_rate::$ERROR_RATE"
      
      - name: Rollback if needed
        if: steps.check.outputs.error_rate > 0.1
        run: |
          echo "Error rate too high, rolling back..."
          vercel rollback --token ${{ secrets.VERCEL_TOKEN }}
```

## 7. 成本估算

### 7.1 Vercel 成本

| 项目 | 免费额度 | 超额费用 | 预估月成本 |
|------|---------|---------|-----------|
| **带宽** | 100GB | $40/TB | $0 (MVP) |
| **函数调用** | 无限 | - | $0 |
| **函数执行时间** | 100GB-Hrs | $0.60/GB-Hr | $0 (MVP) |
| **构建时间** | 6000分钟 | $0.02/分钟 | $0 |

**总计**: $0/月 (MVP阶段)

### 7.2 Supabase 成本

| 项目 | 免费额度 | 超额费用 | 预估月成本 |
|------|---------|---------|-----------|
| **数据库** | 500MB | $0.125/GB | $0 |
| **带宽** | 5GB | $0.09/GB | $0 |
| **存储** | 1GB | $0.021/GB | $0 |

**总计**: $0/月 (MVP阶段)

### 7.3 GLM-5 API 成本

| 项目 | 价格 | 预估使用量 | 月成本 |
|------|------|-----------|--------|
| **输入tokens** | ¥0.001/千tokens | 100万tokens | ¥100 |
| **输出tokens** | ¥0.001/千tokens | 50万tokens | ¥50 |

**总计**: ~¥150/月 (1000次生成)

### 7.4 总成本

**MVP阶段** (月生成1000个APP):
- Vercel: $0
- Supabase: $0
- GLM-5: ¥150 (~$21)
- **总计**: ~$21/月

**扩展阶段** (月生成10000个APP):
- Vercel: $20
- Supabase: $25
- GLM-5: ¥1500 (~$210)
- **总计**: ~$255/月

## 8. 部署检查清单

### 8.1 首次部署

- [ ] **Vercel配置**
  - [ ] 创建Vercel账户
  - [ ] 安装Vercel CLI
  - [ ] 登录并链接项目
  - [ ] 配置环境变量

- [ ] **Supabase配置**
  - [ ] 创建Supabase项目
  - [ ] 创建数据库表
  - [ ] 配置RLS策略
  - [ ] 获取API密钥

- [ ] **GLM-5配置**
  - [ ] 注册智谱AI账户
  - [ ] 获取API密钥
  - [ ] 测试API调用

- [ ] **代码准备**
  - [ ] 确保`vercel.json`配置正确
  - [ ] 确保`.env.example`完整
  - [ ] 运行本地测试通过
  - [ ] 提交到GitHub

- [ ] **首次部署**
  - [ ] 执行`vercel --prod`
  - [ ] 检查部署日志
  - [ ] 测试生产环境URL
  - [ ] 验证API功能

### 8.2 日常部署

- [ ] **代码检查**
  - [ ] 运行`npm run lint`
  - [ ] 运行`npm test`
  - [ ] 检查TypeScript编译
  - [ ] 提交PR

- [ ] **部署验证**
  - [ ] 检查Preview环境
  - [ ] 运行E2E测试
  - [ ] Code Review通过
  - [ ] 合并到main

- [ ] **生产验证**
  - [ ] 检查Production URL
  - [ ] 测试核心功能
  - [ ] 查看监控指标
  - [ ] 检查错误日志

### 8.3 应急响应

- [ ] **部署失败**
  - [ ] 查看错误日志
  - [ ] 回滚到上一版本
  - [ ] 修复问题后重新部署

- [ ] **性能问题**
  - [ ] 检查Vercel Analytics
  - [ ] 查看Supabase Dashboard
  - [ ] 优化慢查询
  - [ ] 增加缓存

- [ ] **服务中断**
  - [ ] 检查Vercel Status
  - [ ] 检查Supabase Status
  - [ ] 通知用户
  - [ ] 快速修复或回滚

---

**下一步**: 详细设计安全方案 → [07-SECURITY.md](./07-SECURITY.md)
