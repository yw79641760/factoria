# LLM API Key 配置指南

## 为什么需要 API Key？

Factoria 使用 GLM-5（智谱 AI）进行能力编排和代码生成。当前环境变量 `LLM_API_KEY` 是占位符，导致：
- ✅ 基础能力识别正常（form-input, add, storage 等）
- ❌ 高级能力无法识别（toggle, delete, chart, export）
- ❌ 代码生成质量受限

## 获取 API Key

### 步骤 1：注册智谱 AI

1. 访问：https://open.bigmodel.cn/
2. 点击右上角"注册"
3. 完成实名认证（需要手机号）
4. 登录后进入控制台

### 步骤 2：创建 API Key

1. 进入"API Key"管理页面
2. 点击"创建 API Key"
3. 复制生成的 Key（格式：`sk-xxxxxxxxxxxxxxxx`）
4. **重要**：妥善保存，平台不显示完整 Key

### 步骤 3：免费额度

智谱 AI 提供免费试用：
- 新用户：赠送免费额度
- 余额查询：控制台首页查看
- 充值：需要时可在线充值

## 配置 API Key

### 方法 1：修改 .env 文件（推荐）

```bash
cd ~/Dev/code/factoria
cp configs/.env.example configs/.env
```

编辑 `configs/.env` 文件：

```env
# LLM 配置
LLM_API_KEY=sk-你的真实APIKey
LLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
LLM_MODEL=glm-4-plus
```

### 方法 2：使用 chezmoi（环境变量管理）

如果使用 chezmoi 管理配置，可以添加到 `~/.local/share/chezmoi/dot_zshrc.tmpl`：

```bash
# Factoria LLM API Key
export LLM_API_KEY={{- (bitwarden "factoria_llm_api_key").password -}}
```

将 API Key 存储在 Bitwarden：
- 项名称：`factoria_llm_api_key`
- 密码字段：粘贴真实的 API Key

然后运行：
```bash
chezmoi apply
```

### 方法 3：临时环境变量（测试用）

仅当前终端会话有效：

```bash
export LLM_API_KEY=sk-你的真实APIKey
cd ~/Dev/code/factoria
npm run dev:api
```

## 重启服务器

配置后需要重启 API 服务器：

```bash
cd ~/Dev/code/factoria

# 停止当前服务器（如果运行中）
# 找到进程 ID
lsof -ti:3000
# 杀死进程
kill $(lsof -ti:3000)

# 重新启动服务器
npm run dev:api
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
  "message": "Factoria API (Ability-Driven) is running",
  "timestamp": "...",
  "version": "1.0.0",
  "architecture": "ability-driven"
}
```

### 方法 2：测试高级能力识别

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"管理待办事项，可以标记完成和删除"}'
```

期望结果：`abilities` 数组中包含 `toggle` 和 `delete`

### 方法 3：查看服务器日志

```bash
npm run dev:api
```

正常启动时应该看到：
```
✅ LLM API Key: configured (sk-****)
✅ LLM API URL: https://open.bigmodel.cn/api/paas/v4/chat/completions
✅ LLM Model: glm-4-plus
```

如果配置失败会看到：
```
⚠️ LLM API Key: not configured (using placeholder)
```

## 成本估算

### GLM-5 定价（参考智谱 AI 官方定价）

**glm-4-plus**（推荐）：
- 输入：¥0.005 / 千 tokens
- 输出：¥0.05 / 千 tokens
- 上下文：128K tokens

**单次生成成本估算**：
- 提示词：~500 tokens（能力编排提示词 + 用户需求）
- 响应：~800 tokens（能力编排 JSON）
- **单次成本**：¥0.0025 + ¥0.04 = **¥0.0425**（约 0.6 美分）

**MVP 阶段（月生成 1000 个 APP）**：
- 1000 次 × ¥0.0425 = **¥42.5 / 月**

**成长期（月生成 10,000 个 APP）**：
- 10,000 次 × ¥0.0425 = **¥425 / 月**

### 成本优化建议

1. **使用 glm-4-flash**（更便宜）：
   - 价格：¥0.0001 / 千 tokens（输入）
   - 适用：快速原型开发
   - 缺点：能力识别准确率略低

2. **缓存常见需求**：
   - 相似需求使用缓存
   - 减少 LLM 调用次数

3. **分级策略**：
   - 简单需求：使用 glm-4-flash
   - 复杂需求：使用 glm-4-plus

## 安全注意事项

### ⚠️ 永远不要

- ❌ 将 API Key 提交到 Git
- ❌ 在公开代码中硬编码 API Key
- ❌ 在前端代码中使用 API Key
- ❌ 分享 API Key 给他人

### ✅ 最佳实践

- ✅ 使用环境变量
- ✅ 使用 `.env` 文件（添加到 `.gitignore`）
- ✅ 使用密码管理器（Bitwarden, 1Password）
- ✅ 定期轮换 API Key
- ✅ 使用专用的 API Key（不要与个人项目共用）

### .gitignore 确保

确保 `.gitignore` 包含：

```gitignore
# 环境变量
.env
.env.local
.env.production
```

## 故障排除

### 问题 1：API Key 无效

**错误信息**：
```
Error: Invalid API Key
```

**解决方案**：
1. 检查 API Key 是否正确复制
2. 确认 API Key 未过期
3. 检查账户余额是否充足

### 问题 2：请求超时

**错误信息**：
```
Error: Request timeout
```

**解决方案**：
1. 检查网络连接
2. 尝试增加超时时间（`api/lib/glm5-client.ts`）
3. 检查智谱 AI 服务状态

### 问题 3：余额不足

**错误信息**：
```
Error: Insufficient balance
```

**解决方案**：
1. 登录智谱 AI 控制台
2. 检查余额
3. 充值账户

### 问题 4：高级能力未识别

**现象**：
- 基础能力识别正常
- 高级能力（toggle, delete）未识别

**原因**：
- LLM_API_KEY 为占位符，未配置真实 Key

**解决方案**：
- 配置真实的 LLM_API_KEY
- 重启服务器

## 下一步

配置完成后，可以测试：

### 1. 基础能力识别（已验证 ✅）

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

### 2. 高级能力识别（需要真实 API Key）

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"管理待办事项，可以标记完成和删除"}'
```

期望识别：`form-input`, `add`, `storage`, `persistence`, `list-display`, `toggle`, `delete`

### 3. 复杂能力识别

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪日常开支，显示图表并导出 Excel"}'
```

期望识别：`form-input`, `add`, `storage`, `persistence`, `list-display`, `chart`, `export`

### 4. 访问前端界面

```bash
# 启动前端
cd ~/Dev/code/factoria
npm run dev:web
```

访问：http://localhost:5176

---

**最后更新**：2026-02-28

**相关文档**：
- [项目 README](README.md)
- [快速开始](QUICKSTART.md)
- [MVP 测试指南](MVP_TEST_GUIDE.md)
- [LLM 集成说明](MVP_WITH_LLM.md)
