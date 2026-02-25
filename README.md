# Factoria - 一句话APP工厂

> 说出你的想法，得到你的专属APP

## 核心理念

App Store 模式过时了。未来是 **Ephemeral Apps** — 即时生成、高度定制、用完即弃。

~300行代码，LLM几秒钟就能生成。为什么还要为每个细分需求找专门的App？

## MVP 目标（2-4周）

**范围**：
- ✅ PWA生成（无需打包，秒级生成）
- ✅ 5种场景：数据追踪、待办清单、计算器、倒计时、笔记
- ✅ Web端输入 → 生成PWA → 添加到主屏幕

**技术栈**：
- 前端：React + Vite
- 后端：Vercel Serverless Functions
- 数据库：Supabase（存储用户APP）
- LLM：GLM-5（代码生成）
- 部署：Vercel

## 架构

```
用户输入需求
  → NLU解析 + 需求确认
  → LLM生成代码（基于模板）
  → Vercel部署
  → 返回PWA链接
```

## 快速开始

### 1. 安装依赖
```bash
cd ~/Dev/code/factoria
npm install
cd web && npm install && cd ..
```

### 2. 启动开发服务器
```bash
npm run dev
```

这会同时启动：
- 🎨 **前端**: http://localhost:5173
- ⚡ **API Mock**: http://localhost:3000

### 3. 测试API
```bash
# 健康检查
curl http://localhost:3000/api/health

# 生成APP（mock）
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

## 开发计划

### Phase 1 - 基础设施（Week 1）✅
- [x] 项目初始化
- [x] Vercel + Supabase 配置
- [x] 基础UI框架

### Phase 2 - 核心功能（Week 2）
- [ ] 需求解析（LLM调用）
- [ ] 代码生成引擎
- [ ] 5个模板（数据追踪、待办、计算器、倒计时、笔记）

### Phase 3 - 部署与优化（Week 3-4）
- [ ] Vercel自动部署
- [ ] PWA配置
- [ ] 用户体验优化

## 灵感来源

- [Karpathy: LLM Year in Review 2025](https://karpathy.bearblog.dev/year-in-review-2025/)
- [Karpathy: 高度定制化软件](https://x.com/karpathy/status/2024583544157458452)

---

**Created**: 2026-02-25  
**Status**: 🚧 MVP Development
