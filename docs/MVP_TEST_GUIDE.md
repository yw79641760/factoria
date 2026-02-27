# Factoria MVP - 能力驱动 + 真实 GLM-5

## ✅ 已完成

### 1. 真实 GLM-5 集成
- ✅ GLM-5 API 调用（https://open.bigmodel.cn）
- ✅ 能力编排（系统提示词 + 用户需求）
- ✅ JSON 响应解析
- ✅ 错误处理和日志

### 2. 最小 MVP 架构
- ✅ React + Vite + Tailwind（前端）
- ✅ Express API（后端）
- ✅ Mock 代码生成（简化）

---

## 🚀 服务器状态

### 运行中
- **前端**：http://localhost:5173
- **API**：http://localhost:3000
- **健康检查**：http://localhost:3000/api/health

### GLM-5 状态
- ✅ 服务器运行中
- ⚠️  **GLM-5 未配置**（需要设置环境变量）

---

## 📋 快速测试

### 1. 健康检查

```bash
curl http://localhost:3000/api/health
```

**期望响应**：
```json
{
  "success": true,
  "message": "Factoria API (Ability-Driven) is running",
  "timestamp": "2026-02-28T00:00:00.000Z",
  "version": "1.0.0",
  "architecture": "ability-driven",
  "glm5": "not configured"
}
```

### 2. 生成 APP（不带 GLM-5）

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

**期望响应**：
```json
{
  "success": true,
  "data": {
    "appId": "app_xxx",
    "url": "https://myapp-xxx.vercel.app",
    "code": "...",
    "orchestration": {
      "intent": "处理需求：追踪每天喝水量",
      "app_name": "我的APP",
      "abilities": ["form-input", "add", "storage", "persistence", "list-display"],
      "orchestration": "表单输入 → 添加记录 → 数据存储 → 数据持久化 → 列表展示",
      "confidence": 0.9
    },
    "abilities": ["form-input", "add", "storage", "persistence", "list-display"],
    "deployTime": 5,
    "glm5": "not configured"
  }
}
```

---

## 🔧 配置 GLM-5 API Key

### 方法 1：环境变量（推荐）

```bash
# 临时设置（当前会话）
export GLM_API_KEY=your_actual_api_key_here

# 重启服务器
cd ~/Dev/code/factoria
npm run dev
```

### 方法 2：.env 文件

```bash
# 创建 .env 文件
cd ~/Dev/code/factoria
cat > .env << 'EOF'
GLM_API_KEY=your_actual_api_key_here
EOF

# 重启服务器
npm run dev
```

### 方法 3：系统环境变量

```bash
# 添加到 ~/.zshrc
echo 'export GLM_API_KEY=your_actual_api_key_here' >> ~/.zshrc
source ~/.zshrc
```

---

## 📊 GLM-5 API 响应示例

### 能力编排结果

**用户输入**："追踪每天喝水量"

**GLM-5 响应**：
```json
{
  "intent": "数据追踪，记录每天的喝水量",
  "app_name": "喝水追踪",
  "abilities": [
    "form-input",
    "add",
    "storage",
    "persistence",
    "list-display",
    "chart"
  ],
  "orchestration": "表单输入 → 添加记录 → 数据存储 → 数据持久化 → 列表展示 → 图表可视化"
}
```

### 生成的代码

GLM-5 会生成包含所有能力的 React 代码，例如：
- 表单输入组件
- 添加按钮
- 数据存储逻辑
- 列表展示组件
- 图表可视化组件

---

## 🎯 能力驱动架构

### 核心公式

```
Agent-Native Software = Framework(Abilities Orchestrated by LLM)

Factoria = React + Vite (Framework) + GLM-5 (Orchestrator)
```

### 能力库

| 分类 | 能力 | 功能 |
|------|------|------|
| **数据层** | storage | 数据存储和管理 |
| | persistence | 数据持久化（localStorage） |
| | export | 数据导出（CSV/JSON） |
| **UI层** | form-input | 表单输入 |
| | list-display | 列表展示 |
| | card-display | 卡片展示 |
| | chart | 图表可视化 |
| **交互层** | add | 添加记录 |
| | edit | 编辑记录 |
| | delete | 删除记录 |
| | toggle | 切换状态 |
| | filter | 过滤数据 |
| | sort | 排序数据 |

---

## 🔑 关键文件

- **API 服务器**：`api-server-glm5.js`
- **GLM-5 客户端**：`api/lib/glm5-client.ts`（未使用，API 中直接调用）
- **前端**：`web/src/App.tsx`
- **配置**：`package.json`

---

## ⚠️ 注意事项

1. **GLM-5 API Key 必需**
   - 不设置 API Key 会返回错误
   - 请从 https://open.bigmodel.cn 获取 API Key

2. **Vercel 部署**
   - MVP 阶段使用模拟 URL
   - 真实部署需要集成 Vercel Deployment API

3. **前端测试**
   - 访问 http://localhost:5173
   - 输入需求
   - 点击生成按钮
   - 查看结果

---

## 🚀 下一步

### 1. 配置 GLM-5 API Key

选择上面的一种方法配置 API Key，然后重启服务器。

### 2. 测试完整流程

1. 健康检查
2. 生成 APP（有 GLM-5）
3. 验证能力编排
4. 查看生成的代码

### 3. 前端集成

前端已经配置好，可以直接测试：
- 输入框
- 生成按钮
- 结果展示

---

**配置好 GLM-5 API Key 后，重启服务器即可测试！** 🎉
