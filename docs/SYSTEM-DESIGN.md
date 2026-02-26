# Factoria 系统设计

## 项目概述

**Factoria** 是一个"一句话APP工厂"——用户只需用一句话描述需求，系统就能自动生成一个可用的PWA应用。

### 核心理念
- **Ephemeral Apps**: 即时生成、高度定制、用完即弃
- **Zero-friction**: 从想法到可用APP < 30秒
- **AI-Native**: LLM驱动的代码生成

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  Web UI (React + Vite + Tailwind)                          │
│  - 需求输入                                                  │
│  - 实时预览                                                  │
│  - 生成结果展示                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 网关层                              │
│  Vercel Serverless Functions                                │
│  - /api/generate                                            │
│  - /api/health                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层                              │
│  1. 需求解析 (NLU)                                          │
│     - GLM-5 API                                             │
│     - 意图识别 + 参数提取                                    │
│                                                             │
│  2. 模板匹配                                                │
│     - 5种基础模板                                           │
│     - 智能推荐                                              │
│                                                             │
│  3. 代码生成                                                │
│     - 模板填充                                              │
│     - 代码优化                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      部署层                                  │
│  Vercel Deployment API                                      │
│  - 动态创建项目                                              │
│  - 自动部署                                                  │
│  - 返回访问URL                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  Supabase (PostgreSQL)                                      │
│  - 用户APP记录                                              │
│  - 生成历史                                                 │
│  - 使用统计                                                 │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 4
- **部署**: Vercel

### 后端
- **API**: Vercel Serverless Functions (Node.js)
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **LLM**: GLM-5 (智谱AI)

### 工具链
- **版本控制**: Git + GitHub
- **包管理**: npm workspaces
- **CI/CD**: GitHub Actions

## 核心流程

### 1. 需求解析流程
```
用户输入 → GLM-5 NLU → 结构化意图
{
  type: "tracker" | "todo" | "calculator" | "countdown" | "notes",
  name: string,
  fields: string[],
  features: string[]
}
```

### 2. 代码生成流程
```
意图 → 模板选择 → 参数填充 → 代码生成 → 优化
```

### 3. 部署流程
```
生成的代码 → Vercel API → 创建项目 → 部署 → 返回URL
```

## 数据模型

### App (生成的应用)
```typescript
interface App {
  id: string;              // 唯一ID
  userId?: string;         // 用户ID (可选)
  prompt: string;          // 原始需求
  intent: Intent;          // 解析后的意图
  template: string;        // 使用的模板
  code: string;            // 生成的代码
  vercelUrl: string;       // Vercel部署URL
  createdAt: Date;         // 创建时间
  status: 'generating' | 'deploying' | 'ready' | 'failed';
}
```

### Intent (意图)
```typescript
interface Intent {
  type: 'tracker' | 'todo' | 'calculator' | 'countdown' | 'notes';
  name: string;
  description?: string;
  fields?: Field[];
  features?: string[];
}

interface Field {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[];  // for select type
}
```

## 5种基础模板

### 1. Tracker (数据追踪)
**用例**: 体重、开支、习惯追踪
**特性**:
- 数据输入表单
- 历史记录列表
- 简单图表
- 导出CSV

### 2. Todo (待办清单)
**用例**: 任务管理
**特性**:
- 添加/删除任务
- 分类标签
- 完成状态
- 过滤排序

### 3. Calculator (计算器)
**用例**: BMI、汇率、单位转换
**特性**:
- 输入表单
- 公式展示
- 结果计算
- 历史记录

### 4. Countdown (倒计时)
**用例**: 生日、纪念日、目标日期
**特性**:
- 目标日期设置
- 可视化倒计时
- 事件提醒
- 分享功能

### 5. Notes (笔记)
**用例**: 快速记录、读书笔记
**特性**:
- Markdown支持
- 标签分类
- 搜索功能
- 导出功能

## API 设计

### POST /api/generate
**请求**:
```json
{
  "prompt": "追踪每天喝水量",
  "userId": "user_123"  // 可选
}
```

**响应**:
```json
{
  "success": true,
  "appId": "app_1771983308548",
  "url": "https://app-1771983308548.vercel.app",
  "code": "// Generated React code...",
  "intent": {
    "type": "tracker",
    "name": "喝水量追踪",
    "fields": ["日期", "水量(ml)"]
  }
}
```

### GET /api/health
**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T01:27:35.915Z"
}
```

## 性能指标

### MVP目标
- ⏱️ 生成速度: < 30秒
- ✅ 成功率: > 80%
- 😊 用户满意度: > 4/5

### 未来目标
- ⏱️ 生成速度: < 10秒
- ✅ 成功率: > 95%
- 👥 月活用户: > 1000
- 📱 生成APP数: > 10000

## 安全考虑

### API安全
- Rate limiting (每个IP: 10次/小时)
- Input validation
- XSS防护

### 数据安全
- 用户数据加密存储
- API密钥环境变量管理
- HTTPS only

### 部署安全
- 沙箱隔离
- 资源限制
- 自动清理过期应用

## 扩展性设计

### 水平扩展
- Serverless架构自动扩展
- 数据库读写分离
- CDN加速

### 功能扩展
- 模板插件系统
- 第三方集成
- 自定义模板上传

## 监控与日志

### 监控指标
- 生成成功率
- 平均生成时间
- API响应时间
- 错误率

### 日志记录
- 用户操作日志
- API调用日志
- 错误日志
- 性能日志

## 未来规划

### Phase 2 (3-6个月)
- [ ] 用户账户系统
- [ ] 模板市场
- [ ] 团队协作
- [ ] 版本控制

### Phase 3 (6-12个月)
- [ ] 移动端APP
- [ ] AI模板推荐
- [ ] 付费计划
- [ ] 企业版

---

**文档版本**: 1.0
**最后更新**: 2026-02-25
**维护者**: Factoria Team
