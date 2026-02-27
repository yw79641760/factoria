# 快速开始 - Factoria MVP（能力驱动 + 真实 LLM）

## 🚀 快速启动

### 步骤 1：配置 LLM_API_KEY

```bash
# 临时配置（当前会话）
export LLM_API_KEY=your_actual_api_key_here

# 或创建 .env 文件
cd ~/Dev/code/factoria
cat > .env << 'EOF'
LLM_API_KEY=your_actual_api_key_here
EOF

# 重启服务器
npm run dev
```

### 步骤 2：验证配置

```bash
# 检查健康状态
curl http://localhost:3000/api/health

# 期望响应（已配置）
{
  "success": true,
  "llm": "configured"
}
```

### 步骤 3：测试生成 API

```bash
# 不带 LLM 的测试（快速）
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'

# 带 LLM 的测试（完整）
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量，生成图表展示"}'
```

---

## 📋 测试用例

### 用例 1：数据追踪（带图表）

**输入**：
```json
{
  "prompt": "追踪每天喝水量，生成图表展示"
}
```

**期望能力编排**：
```json
{
  "intent": "数据追踪，记录每天的喝水量，并生成图表展示",
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

### 用例 2：待办清单（完成和删除）

**输入**：
```json
{
  "prompt": "管理我的待办事项，可以标记完成和删除"
}
```

**期望能力编排**：
```json
{
  "intent": "任务管理，添加和完成待办事项",
  "app_name": "待办清单",
  "abilities": [
    "form-input",
    "add",
    "storage",
    "persistence",
    "list-display",
    "toggle",
    "delete"
  ],
  "orchestration": "表单输入 → 添加任务 → 数据存储 → 数据持久化 → 列表展示 → 切换完成状态 → 删除任务"
}
```

### 用例 3：数据导出

**输入**：
```json
{
  "prompt": "追踪开支，并能导出为 CSV"
}
```

**期望能力编排**：
```json
{
  "intent": "数据追踪，记录开支，并导出为 CSV",
  "app_name": "开支追踪",
  "abilities": [
    "form-input",
    "add",
    "storage",
    "persistence",
    "list-display",
    "chart",
    "export"
  ],
  "orchestration": "表单输入 → 添加记录 → 数据存储 → 数据持久化 → 列表展示 → 图表可视化 → 数据导出"
}
```

---

## 🔑 环境变量

### LLM_API_KEY

**用途**：LLM API 密钥（支持 GLM-5、Claude 等）

**配置方法**：
```bash
export LLM_API_KEY=your_api_key_here
```

**获取 API Key**：
- **GLM-5**：https://open.bigmodel.cn/
- **Claude**：https://console.anthropic.com/

---

## 📊 API 响应格式

### 生成 API 响应

```json
{
  "success": true,
  "data": {
    "appId": "app_1740691234567",
    "url": "https://myapp-1740691234567.vercel.app",
    "code": "import React, { useState, useEffect } from 'react';\n\nexport default function App() {\n  ...\n}",
    "orchestration": {
      "intent": "用户意图描述",
      "app_name": "应用名称",
      "abilities": ["ability1", "ability2", ...],
      "orchestration": "编排逻辑说明",
      "confidence": 0.9
    },
    "abilities": ["ability1", "ability2", ...],
    "deployTime": 3,
    "llm": "configured"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "LLM_NOT_CONFIGURED",
    "message": "LLM API key is not configured. Please set LLM_API_KEY environment variable."
  }
}
```

---

## 🎯 能力库

### 数据层
- `storage` - 数据存储和管理
- `persistence` - 数据持久化（localStorage）
- `export` - 数据导出（CSV/JSON）

### UI 层
- `form-input` - 表单输入
- `list-display` - 列表展示
- `card-display` - 卡片展示
- `chart` - 图表可视化

### 交互层
- `add` - 添加记录
- `edit` - 编辑记录
- `delete` - 删除记录
- `toggle` - 切换状态（完成/未完成）
- `filter` - 过滤数据
- `sort` - 排序数据

---

## 🔧 故障排查

### 问题 1：LLM_NOT_CONFIGURED

**原因**：LLM_API_KEY 环境变量未设置

**解决方案**：
```bash
# 检查环境变量
echo $LLM_API_KEY

# 设置环境变量
export LLM_API_KEY=your_actual_api_key_here

# 重启服务器
npm run dev
```

### 问题 2：LLM API 调用失败

**原因**：API Key 无效或 API 服务不可用

**解决方案**：
```bash
# 验证 API Key
curl https://open.bigmodel.cn/api/paas/v3/model-api/glm-4/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "glm-4", "messages": [{"role": "user", "content": "test"}]}'
```

### 问题 3：前端无法连接到 API

**原因**：API 服务器未启动或端口不正确

**解决方案**：
```bash
# 检查 API 服务器状态
curl http://localhost:3000/api/health

# 确认端口
# API: http://localhost:3000
# 前端: http://localhost:5173
```

---

## 📝 日志和调试

### 启用调试模式

```bash
# API 服务器
DEBUG=1 npm run dev:api

# 查看日志
tail -f ~/.npm/_logs/
```

### 常见日志

**正常日志**：
```
Processing prompt: "追踪每天喝水量"
Abilities orchestrated: form-input, add, storage, persistence, list-display, chart
Generated mock app
```

**错误日志**：
```
Generate API error: LLM API error: 401 - Invalid API key
```

---

## 🚀 下一步

1. **配置 LLM_API_KEY**
   - 获取 API Key
   - 设置环境变量
   - 重启服务器

2. **测试完整流程**
   - 健康检查
   - 生成 APP（带 LLM）
   - 验证能力编排

3. **前端测试**
   - 访问前端界面
   - 输入需求
   - 查看结果

---

**准备好测试了吗？** 🎉

配置 `LLM_API_KEY` 并重启服务器即可开始！
