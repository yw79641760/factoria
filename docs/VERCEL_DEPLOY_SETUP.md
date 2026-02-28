# Vercel Deploy Hooks 配置指南

## 为什么需要 Deploy Hooks？

Factoria 需要将生成的 APP 部署到真实 URL。使用 Vercel Deploy Hooks 可以：
- ✅ 自动触发部署
- ✅ 返回真实的 APP URL
- ✅ 无需手动操作
- ✅ 支持 Git 集成的所有功能

## 前置条件

1. **Vercel 账户**
   - 访问：https://vercel.com
   - 注册（免费）
   - 登录

2. **GitHub 账户**（可选）
   - 如果使用 GitHub 集成部署，需要 GitHub 账户

## 配置步骤

### 步骤 1：创建 Vercel 项目

1. 登录 Vercel：https://vercel.com
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository" 或 "Empty Project"
4. **推荐**：使用 GitHub 仓库（便于管理）
   - 创建 GitHub 仓库：https://github.com/new
   -仓库名称：`factoria-apps`
   - 初始化 README
   - 在 Vercel 导入该仓库

5. 配置项目：
   - Project Name：`factoria-apps`
   - Framework Preset：Vite
   - Root Directory：留空或设置正确路径
   - Build Command：`npm run build`
   - Output Directory：`web/dist`

6. 点击 "Deploy"

### 步骤 2：获取 Deploy Hook URL

1. 进入项目页面：https://vercel.com/dashboard
2. 选择 `factoria-apps` 项目
3. 点击 "Settings" 标签
4. 选择 "Git" → "Deploy Hooks"
5. 点击 "Create Hook"
6. 命名：`Factoria Auto Deploy`
7. 复制生成的 Deploy Hook URL（格式：`https://api.vercel.com/v1/integrations/deploy/...`）

**注意**：Deploy Hook URL 包含敏感信息，不要分享！

### 步骤 3：配置环境变量

编辑 Factoria 的 `configs/.env` 文件：

```env
# Vercel 配置
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
VERCEL_PROJECT_ID=prj_xxxxxxx  # 可选：从项目 URL 获取
```

**获取 VERCEL_PROJECT_ID**：
1. 访问项目 URL：https://vercel.com/your-username/factoria-apps
2. 查看浏览器地址栏
3. 格式：`https://vercel.com/username/project-id`
4. 复制 `project-id` 部分（格式：`prj_xxxxxxx`）

### 步骤 4：重启 API 服务器

```bash
cd ~/Dev/code/factoria

# 停止当前服务器（如果运行中）
kill $(lsof -ti:3000)

# 重新启动服务器
npm run dev:api
```

## 验证配置

### 方法 1：测试部署

生成一个测试 APP：

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"测试APP"}'
```

期望结果：
- 返回的 URL 应该是真实的 Vercel URL
- URL 格式：`https://factoria-apps-xxx.vercel.app`

### 方法 2：检查服务器日志

```bash
npm run dev:api
```

正常启动时应该看到：
```
✅ Vercel Deploy Hook: configured
✅ Vercel Project ID: prj_xxxxxxx
```

如果配置失败会看到：
```
⚠️ Vercel Deploy Hook: not configured
```

### 方法 3：查看 Vercel 部署历史

1. 访问 Vercel 项目：https://vercel.com/your-username/factoria-apps/deployments
2. 查看最新的部署
3. 应该看到由 Factoria 触发的部署

## 工作原理

### 部署流程

```
1. 用户输入需求
   ↓
2. Factoria 生成代码
   ↓
3. 推送代码到 GitHub（自动）
   ↓
4. Factoria 触发 Deploy Hook
   ↓
5. Vercel 检测到代码变更
   ↓
6. Vercel 自动构建和部署
   ↓
7. 返回真实 URL
```

### 技术细节

**Deploy Hook**：
- 是一个唯一的 HTTP 端点
- 发送 GET 或 POST 请求即可触发部署
- Vercel 自动从 Git 仓库拉取最新代码
- 自动执行构建和部署

**Factoria 集成**：
- 每次生成 APP 后，自动触发 Deploy Hook
- 等待 Vercel 部署完成
- 返回部署 URL 和耗时

## 安全注意事项

### ⚠️ 永远不要

- ❌ 将 Deploy Hook URL 提交到 Git
- ❌ 在公开代码中硬编码 URL
- ❌ 分享 Deploy Hook URL 给他人

### ✅ 最佳实践

- ✅ 使用环境变量
- ✅ 使用 `.env` 文件（添加到 `.gitignore`）
- ✅ 定期轮换 Deploy Hook URL
- ✅ 监控 Vercel 部署日志

### .gitignore 确保

确保 `.gitignore` 包含：

```gitignore
# 环境变量
.env
.env.local
.env.production
```

## 故障排除

### 问题 1：部署未触发

**错误信息**：
```
Failed to trigger deployment: Unauthorized
```

**解决方案**：
1. 检查 Deploy Hook URL 是否正确
2. 确认 Deploy Hook 未被删除
3. 重新创建 Deploy Hook

### 问题 2：构建失败

**错误信息**：
```
Build failed: Build failed
```

**解决方案**：
1. 检查 Vercel 项目配置
2. 确认 Build Command 和 Output Directory 正确
3. 查看构建日志（Vercel Dashboard）

### 问题 3：URL 未更新

**现象**：
- 部署成功，但返回的 URL 还是模拟 URL

**原因**：
- Deploy Hook 配置未生效

**解决方案**：
1. 重启 API 服务器
2. 确认环境变量已加载
3. 检查 `configs/.env` 文件

## 替代方案

### 方案 1：手动部署

如果 Deploy Hooks 不可用，可以：

1. 每次生成后，手动推送到 GitHub
2. Vercel 自动部署
3. 从 Vercel Dashboard 获取 URL

**优点**：无需配置
**缺点**：需要手动操作

### 方案 2：Vercel CLI

使用 Vercel CLI 手动触发部署：

```bash
cd ~/Dev/code/factoria
vercel --prod
```

**优点**：快速
**缺点**：需要手动执行

## 下一步

配置完成后，可以测试：

### 1. 生成测试 APP

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"简单的计数器APP"}'
```

### 2. 访问部署的 APP

应该看到：
```
https://factoria-apps.vercel.app
```

### 3. 验证功能

APP 应该：
- ✅ 正常加载
- ✅ 功能正常
- ✅ 可以使用

---

**最后更新**：2026-02-28

**相关文档**：
- [项目 README](../README.md)
- [Vercel 部署设计](VERCEL_DEPLOY_DESIGN.md)
- [LLM API Key 配置](SETUP_LLM_API_KEY.md)
- [MVP 测试指南](MVP_TEST_GUIDE.md)
