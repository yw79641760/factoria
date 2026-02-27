# Factoria - 能力驱动一句话APP工厂

> 说出你的想法，得到你的专属APP

## 核心理念

**Agent-Native Software = Framework(Abilities Orchestrated by LLM)**

App Store 模式过时了。未来是 **Ephemeral Apps** — 即时生成、高度定制、用完即弃。

~300行代码，LLM几秒钟就能生成。为什么还要为每个细分需求找专门的App？

---

## 🎯 架构

### 能力驱动（v2.0）

```
用户输入需求
  → NLU解析 + 能力识别
  → LLM编排能力（基于能力库）
  → 生成代码
  → Vercel部署
  → 返回PWA链接
```

### 核心公式

**Factoria = Framework(Abilities Orchestrated by GLM-5)**

- **Framework**: React 18 + Vite + Tailwind（呈现层）
- **Abilities**: 11个可组合的能力（数据、UI、交互层）
- **LLM**: GLM-5（能力编排者）

详细设计请参考：[docs/01-ARCHITECTURE-v2.md](docs/01-ARCHITECTURE-v2.md)

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

## 🚀 快速开始

### 1. 配置 LLM_API_KEY

```bash
# 设置环境变量（推荐）
export LLM_API_KEY=your_actual_api_key_here

# 或者创建 .env 文件
cd ~/Dev/code/factoria
cat > .env << 'EOF'
LLM_API_KEY=your_actual_api_key_here
EOF
```

获取 API Key：https://open.bigmodel.cn/

### 2. 安装依赖
```bash
cd ~/Dev/code/factoria
npm install
cd web && npm install && cd ..
```

### 3. 启动开发服务器
```bash
npm run dev
```

这会同时启动：
- 🎨 **前端**: http://localhost:5173
- 🤖 **API**: http://localhost:3000

### 4. 测试API

#### 健康检查
```bash
curl http://localhost:3000/api/health
```

#### 生成APP
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

---

## 📋 开发计划

### Phase 1: 基础设施 ✅ 80% 完成

- [x] 项目初始化
- [x] Vite + React + TypeScript
- [x] Tailwind CSS
- [x] 基础UI框架
- [x] 能力驱动架构
- [x] GLM-5 API集成（能力编排）
- [x] 需求解析（能力识别）
- [x] 代码生成引擎
- [x] Supabase数据库配置

### Phase 2: 核心功能 ✅ 80% 完成

- [x] GLM-5客户端封装（能力编排）
- [x] 能力库定义（11个能力）
- [x] 生成API端点（能力驱动）
- [x] 前端UI实现
- [x] Mock代码生成
- [ ] Vercel自动部署集成
- [ ] PWA配置
- [ ] 数据持久化（完整实现）

### Phase 3: 优化与上线 ⏳ 0% 完成

- [ ] Vercel自动部署
- [ ] PWA配置
- [ ] 用户体验优化
- [ ] 错误处理
- [ ] 性能优化
- [ ] 文档完善
- [ ] 部署上线

---

## 🧪 快速测试

### 测试用例

| 用例 | 提示词 | 预期能力 |
|------|--------|---------|
| 追踪喝水 | "追踪每天喝水量" | form-input, add, storage, persistence, list-display, chart |
| 待办清单 | "管理我的待办事项" | form-input, add, storage, persistence, list-display, toggle, delete |
| 开支追踪 | "追踪我的日常开支" | form-input, add, storage, persistence, list-display, chart, export |
| 笔记 | "快速记录读书笔记" | form-input, add, storage, persistence, list-display, search |

---

## 💡 灵感来源

- [Karpathy: LLM Year in Review 2025](https://karpathy.bearblog.dev/year-in-review-2025/)
- [Karpathy: 高度定制化软件](https://x.com/karpathy/status/2024583544157458452)

---

## 📚 文档

- [能力驱动架构](docs/01-ARCHITECTURE-v2.md)
- [快速开始](QUICKSTART.md)
- [MVP 测试指南](MVP_TEST_GUIDE.md)
- [LLM 集成说明](MVP_WITH_LLM.md)

---

**Created**: 2026-02-25  
**Status**: 🚧 MVP Development (Ability-Driven)
