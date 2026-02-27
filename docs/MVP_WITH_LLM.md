# Factoria MVP - 能力驱动 + 真实 LLM 集成

## ✅ 已完成

### 1. LLM 集成（通用化）

- ✅ API Key 环境变量：`LLM_API_KEY`（更通用，支持多种 LLM）
- ✅ 真实 LLM 调用（GLM-5）
- ✅ 能力编排系统
- ✅ 响应解析

### 2. 最小 MVP 架构

- ✅ 前端（Vite + React）
- ✅ API 服务器（Express）
- ✅ 健康检查端点
- ✅ 生成 API 端点
- ✅ 错误处理和日志

---

## 🚀 服务器状态

### 运行中

- **前端**：http://localhost:5173
- **API**：http://localhost:3000
- **健康检查**：http://localhost:3000/api/health
- **生成端点**：POST http://localhost:3000/api/generate

### LLM 配置

- **状态**：⚠️ 需要配置 API Key
- **环境变量**：`LLM_API_KEY`
- **支持 LLM**：GLM-5（默认，可扩展）

---

## 🔧 配置 LLM_API_KEY

### 方法 1：环境变量

```bash
# 临时设置（当前会话）
export LLM_API_KEY=your_actual_api_key_here

# 重启服务器
cd ~/Dev/code/factoria
npm run dev
```

### 方法 2：.env 文件

```bash
# 更新 .env 文件
cd ~/Dev/code/factoria
cat > .env << 'EOF'
LLM_API_KEY=your_actual_api_key_here
EOF

# 重启服务器
npm run dev
```

---

## 📋 API 端点

### 1. Health Check

```bash
GET http://localhost:3000/api/health
```

**响应**：
```json
{
  "success": true,
  "message": "Factoria API (Ability-Driven) is running",
  "timestamp": "...",
  "version": "1.0.0",
  "architecture": "ability-driven",
  "llm": "configured" | "not configured"
}
```

### 2. Generate API

```bash
POST http://localhost:3000/api/generate
Content-Type: application/json

{
  "prompt": "追踪每天喝水量"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "appId": "app_xxx",
    "url": "https://myapp-xxx.vercel.app",
    "code": "...",
    "orchestration": {
      "intent": "用户意图描述",
      "app_name": "应用名称",
      "abilities": ["ability1", "ability2", ...],
      "orchestration": "编排逻辑说明"
    },
    "abilities": ["ability1", "ability2", ...],
    "deployTime": 3,
    "llm": "configured"
  }
}
```

---

## 🤖 LLM 系统提示词

### 能力编排提示词

```
你是一个能力编排专家。

核心思想：不是选择模板，而是识别并编排需要的能力。

能力库：
数据层能力：
- storage: 数据存储和管理
- persistence: 数据持久化（localStorage）
- export: 数据导出（CSV/JSON）

UI层能力：
- form-input: 表单输入
- list-display: 列表展示
- card-display: 卡片展示
- chart: 图表可视化

交互层能力：
- add: 添加记录
- edit: 编辑记录
- delete: 删除记录
- toggle: 切换状态（完成/未完成）
- filter: 过滤数据
- sort: 排序数据

你的任务：
1. 理解用户意图
2. 识别需要的能力（从能力库中选择）
3. 按顺序编排这些能力
4. 生成完整的React代码

示例：
用户："追踪每天喝水量"
→ 意图：数据追踪
→ 需要的能力：form-input → add → storage → persistence → list-display → chart
→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、图表可视化

用户："管理待办清单"
→ 意图：任务管理
→ 需要的能力：form-input → add → storage → persistence → list-display → toggle → delete
→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、切换完成状态、删除功能

输出格式（JSON）：
{
  "intent": "用户意图描述",
  "app_name": "应用名称（2-8字）",
  "abilities": ["ability1", "ability2", ...],
  "orchestration": "编排逻辑说明"
}

只返回JSON，不要包含其他说明文字。
```

---

## 🎯 能力驱动架构

### 核心公式

```
Agent-Native Software = Framework(Abilities Orchestrated by LLM)

Factoria = Framework(Abilities Orchestrated by GLM-5)
          = 框架 (LLM 编排的能力)
```

### 能力库

| 分类 | 能力 | 功能 |
|------|------|------|
| **数据层** | storage | 数据存储和管理 |
| | persistence | 数据持久化 |
| | export | 数据导出 |
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

## 📊 测试步骤

### 1. 配置 LLM_API_KEY

```bash
# 设置环境变量
export LLM_API_KEY=your_actual_api_key_here

# 重启服务器
cd ~/Dev/code/factoria
npm run dev
```

### 2. 测试健康检查

```bash
curl http://localhost:3000/api/health
```

**期望响应**：
```json
{
  "success": true,
  "llm": "configured"
}
```

### 3. 测试生成 API

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
      "intent": "数据追踪，记录每天的喝水量",
      "app_name": "喝水追踪",
      "abilities": ["form-input", "add", "storage", "persistence", "list-display", "chart"],
      "orchestration": "表单输入 → 添加记录 → 数据存储 → 数据持久化 → 列表展示 → 图表可视化"
    },
    "abilities": ["form-input", "add", "storage", "persistence", "list-display", "chart"],
    "deployTime": 3,
    "llm": "configured"
  }
}
```

---

## 📁 项目结构

```
factoria/
├── api/
│   ├── lib/
│   │   ├── abilities.ts              # 能力接口定义
│   │   ├── glm5-client.ts           # GLM-5 客户端（能力编排）
│   │   └── database.ts              # 数据库操作
│   ├── api-server-glm5.js            # API 服务器（真实 LLM）
│   ├── generate-real.ts             # 生成 API（能力编排）
│   ├── generate.ts                  # Mock API
│   └── health.ts                    # 健康检查
├── docs/
│   ├── 01-ARCHITECTURE-v2.md        # 能力驱动架构
│   └── ...
├── web/
│   ├── src/
│   │   └── App.tsx                  # 前端界面
│   └── ...
├── .env                              # 环境变量（包含 LLM_API_KEY）
├── api-server-glm5.js               # API 服务器
└── package.json
```

---

## 🎯 核心成就

### 从模板驱动到能力驱动

| 维度 | 之前 | 现在 |
|------|------|------|
| **LLM 角色** | 模板填充者 | 能力编排者 |
| **代码生成** | 基于模板 | 基于编排 |
| **灵活性** | 低（受限于模板） | 高（能力可组合） |
| **扩展性** | 需要新模板 | 沉淀新能力 |
| **LLM 配置** | 硬编码 | 通用环境变量 |
| **API Key 名称** | `GLM_API_KEY` | `LLM_API_KEY`（更通用） |

---

## ⚠️ 注意事项

1. **LLM_API_KEY 必须配置**
   - 不配置会返回错误
   - 请从 https://open.bigmodel.cn/ 获取 GLM-5 API Key

2. **环境变量名称**
   - `LLM_API_KEY`（通用，支持多种 LLM）
   - 不再使用 `GLM_API_KEY`

3. **Vercel 部署**
   - MVP 阶段返回模拟 URL
   - 真实部署需要额外开发

4. **前端测试**
   - 访问 http://localhost:5173
   - 输入需求，点击生成
   - 查看结果

---

## 📚 文档

- [能力驱动架构](docs/01-ARCHITECTURE-v2.md)
- [API 设计](docs/02-API-DESIGN-v2.md)

---

**状态**：✅ LLM 集成已完成，等待配置 LLM_API_KEY

**最后更新**：2026-02-28 01:10
