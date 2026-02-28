# Vercel 部署配置指南

## 为什么需要 Vercel 部署？

Factoria 的核心价值是"一句话生成 APP"。为了让生成的 APP 真正可用，需要：

1. **自动部署** - 用户生成 APP 后，立即获得可访问的 URL
2. **独立部署** - 每个 APP 有独立的 URL
3. **快速启动** - 部署时间 < 10 秒

Vercel 提供了完美的解决方案：
- 全球 CDN 加速
- 自动 HTTPS
- 免费额度（100GB/月）
- REST API 支持（程序化部署）

## 获取 Vercel 配置

### 步骤 1：创建 Vercel 账户

1. 访问：https://vercel.com/
2. 点击 "Sign Up"
3. 使用 GitHub、GitLab 或 Bitbucket 账户登录（推荐 GitHub）

### 步骤 2：创建部署模板项目

**重要**：这是部署模板，不是 Factoria 主项目！

1. 登录 Vercel Dashboard
2. 点击 "Add New" → "Project"
3. 导入一个简单的静态项目（或创建空项目）
4. 选择 **Empty Project**
5. 项目名称：`factoria-app-template`（或其他名称）
6. 点击 "Create Project"

### 步骤 3：获取 Access Token

1. 进入 Vercel Dashboard
2. 点击右上角头像 → "Settings"
3. 左侧菜单选择 "Tokens"
4. 点击 "Create Token"
5. 输入名称：`Factoria API Token`
6. 权限选择：**Full Account**（需要部署权限）
7. 复制生成的 Token（格式：`xx...xx`）
8. **重要**：妥善保存，平台不显示完整 Token

### 步骤 4：获取 Project ID

1. 进入 Vercel Dashboard
2. 打开之前创建的 `factoria-app-template` 项目
3. 点击 "Settings" 标签
4. 在 "General" 部分，找到 **Project ID**
5. 复制 Project ID（格式：`prj_xxx`）

## 配置环境变量

### 方法 1：修改 .env 文件（推荐）

```bash
cd ~/Dev/code/factoria
cp configs/.env.example configs/.env
```

编辑 `configs/.env` 文件：

```env
# Vercel (for real deployment)
VERCEL_ACCESS_TOKEN=你的真实Token
VERCEL_PROJECT_ID=你的ProjectID
VERCEL_PROJECT_NAME=factoria-app-template
```

### 方法 2：使用 chezmoi（环境变量管理）

如果使用 chezmoi 管理配置，可以添加到 `~/.local/share/chezmoi/dot_zshrc.tmpl`：

```bash
# Factoria Vercel Deployment
export VERCEL_ACCESS_TOKEN={{- (bitwarden "factoria_vercel_token").password -}}
export VERCEL_PROJECT_ID={{- (bitwarden "factoria_vercel_project_id").password -}}
export VERCEL_PROJECT_NAME={{- (bitwarden "factoria_vercel_project_name").password -}}
```

将配置存储在 Bitwarden：
- 项 1：`factoria_vercel_token`
  - 密码字段：粘贴真实的 Access Token
- 项 2：`factoria_vercel_project_id`
  - 密码字段：粘贴 Project ID
- 项 3：`factoria_vercel_project_name`
  - 密码字段：粘贴项目名称（如：factoria-app-template）

然后运行：
```bash
chezmoi apply
```

## 验证配置

### 方法 1：健康检查

```bash
curl http://localhost:3000/api/health
```

应该看到：
```json
{
  "success": true,
  "message": "Factoria API (Ability-Driven) is running"
}
```

### 方法 2：测试部署功能

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

期望结果：
- 如果配置正确：返回真实的 Vercel URL
- 如果配置错误：返回模拟 URL（`https://app_xxx.vercel.app`）

### 方法 3：查看服务器日志

```bash
npm run dev:api
```

正常启动时应该看到：
```
✅ LLM API Key: configured (sk-****)
✅ Vercel Access Token: configured
✅ Vercel Project ID: configured (prj-****)
```

如果配置失败会看到：
```
⚠️ Vercel Access Token: not configured (using mock deployment)
```

## 部署流程

### Factoria 使用 Vercel REST API

**原因**：
- 每个生成的 APP 代码不同
- 需要动态部署，不是触发现有项目构建
- 使用 REST API 可以上传自定义代码

**流程**：
```
用户输入需求
  ↓
GLM-5 识别能力并生成代码
  ↓
生成 HTML 文件（包含代码）
  ↓
调用 Vercel REST API
  ↓
上传文件到 Vercel
  ↓
创建新部署
  ↓
返回部署 URL
  ↓
用户打开 APP
```

### 部署时间

- **MVP 阶段**：5 秒（模拟部署）
- **真实部署**：10-30 秒（取决于代码大小和网络）

## Vercel 免费额度

**免费计划**（Hobby）：
- 带宽：100GB / 月
- 构建时间：6,000 分钟 / 月
- Serverless 函数：100GB-Hrs / 月
- 部署次数：无限制
- 自定义域名：无限制

**成本估算**：

**MVP 阶段**（月生成 1000 个 APP）：
- 带宽：1000 APP × 0.1GB = 100GB / 月
- **总计**：$0 / 月（免费计划）

**成长期**（月生成 10,000 个 APP）：
- 带宽：10,000 APP × 0.1GB = 1000GB / 月
- **总计**：$20 / 月（超出免费额度）

## 部署模板项目

### 为什么需要模板项目？

Factoria 需要一个模板项目来：
- 确保部署配置正确
- 避免每次部署都重新配置
- 保持部署一致性

### 创建简单的部署模板

**index.html**：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factoria App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        // 动态注入的代码
    </script>
</body>
</html>
```

**vercel.json**（Vercel 配置）：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 安全注意事项

### ⚠️ 永远不要

- ❌ 将 Vercel Access Token 提交到 Git
- ❌ 在公开代码中硬编码 Token
- ❌ 在前端代码中使用 Token
- ❌ 分享 Token 给他人

### ✅ 最佳实践

- ✅ 使用环境变量
- ✅ 使用 `.env` 文件（添加到 `.gitignore`）
- ✅ 使用密码管理器（Bitwarden, 1Password）
- ✅ 定期轮换 Token
- ✅ 使用专用的 Token（不要与个人项目共用）
- ✅ 限制 Token 权限（只给必要的权限）

### .gitignore 确保

确保 `.gitignore` 包含：

```gitignore
# 环境变量
.env
.env.local
.env.production
```

## 故障排除

### 问题 1：Access Token 无效

**错误信息**：
```
Error: Invalid Access Token
```

**解决方案**：
1. 检查 Token 是否正确复制
2. 确认 Token 未过期
3. 检查 Token 权限是否足够（需要 Full Account）

### 问题 2：Project ID 不存在

**错误信息**：
```
Error: Project not found
```

**解决方案**：
1. 确认 Project ID 是否正确
2. 检查项目是否存在
3. 确认 Token 有权限访问该项目

### 问题 3：部署失败

**错误信息**：
```
Error: Deployment failed
```

**解决方案**：
1. 检查生成的 HTML 代码是否有效
2. 查看服务器日志
3. 检查 Vercel Dashboard 的部署历史

### 问题 4：始终使用模拟部署

**现象**：
- 无论配置如何，都返回模拟 URL
- 服务器日志显示 "using mock deployment"

**原因**：
- 环境变量未配置
- 服务器未重启

**解决方案**：
1. 检查 `.env` 文件是否配置了 VERCEL_ACCESS_TOKEN
2. 重启服务器
3. 查看服务器日志

## 成本优化建议

1. **使用缓存**：
   - 相同需求使用缓存
   - 减少 API 调用次数

2. **限制带宽**：
   - 每个 APP 设置带宽限制
   - 防止单个 APP 爆发流量

3. **CDN 缓存**：
   - 使用 Vercel Edge Cache
   - 减少源站带宽

4. **监控使用情况**：
   - 定期检查 Vercel Dashboard
   - 及时调整策略

## 下一步

配置完成后，可以测试：

### 1. 基础部署测试

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

期望返回：
```json
{
  "success": true,
  "data": {
    "url": "https://app_xxx.vercel.app",
    "deployTime": 10
  }
}
```

### 2. 访问生成的 APP

返回的 URL 应该可以直接访问：
```
https://app_xxx.vercel.app
```

### 3. 验证部署内容

打开 URL 应该看到：
- APP 的完整界面
- 可以正常交互
- 响应速度快（全球 CDN）

---

**最后更新**：2026-02-28

**相关文档**：
- [项目 README](README.md)
- [LLM API Key 配置指南](LLM_API_KEY_GUIDE.md)
- [快速开始](QUICKSTART.md)
- [MVP 测试指南](MVP_TEST_GUIDE.md)
