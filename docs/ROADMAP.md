# Factoria 开发路线图

## 🎯 MVP 目标（2-4周）

### Week 1: 基础设施 ✅

#### Day 1 (2026-02-25)
- [x] 项目初始化
- [x] Vite + React + TypeScript
- [x] Tailwind CSS
- [x] 基础UI框架
- [x] 项目结构设计
- [ ] Supabase配置
- [ ] Vercel部署配置

#### Day 2-3
- [ ] GLM-5 API集成
- [ ] 需求解析NLU
- [ ] 5个基础模板（tracker, todo, calculator, countdown, notes）

### Week 2: 核心功能

#### Day 4-5
- [ ] 代码生成引擎
- [ ] 模板填充逻辑
- [ ] 基础测试用例

#### Day 6-7
- [ ] Vercel自动部署集成
- [ ] PWA配置（manifest.json, service-worker）
- [ ] 数据持久化（Supabase）

### Week 3-4: 优化与上线

#### Day 8-10
- [ ] 用户体验优化
- [ ] 错误处理
- [ ] 加载状态

#### Day 11-14
- [ ] 性能优化
- [ ] 文档完善
- [ ] 部署上线
- [ ] 用户测试

## 🔧 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **部署**: Vercel

### 后端
- **API**: Vercel Serverless Functions
- **数据库**: Supabase (PostgreSQL)
- **LLM**: GLM-5 (代码生成)

### 工具
- **版本控制**: Git + GitHub
- **包管理**: npm workspaces
- **CI/CD**: GitHub Actions

## 📋 核心功能清单

### P0 (MVP必须)
- [x] 需求输入界面
- [ ] 需求解析（NLU）
- [ ] 代码生成（5个模板）
- [ ] 自动部署
- [ ] PWA支持
- [ ] 数据存储

### P1 (优先)
- [ ] 需求确认Q&A
- [ ] 代码预览
- [ ] 一键分享
- [ ] 历史记录

### P2 (未来)
- [ ] 模板市场
- [ ] 用户账户系统
- [ ] 付费计划
- [ ] 移动端APP

## 🎨 5个基础模板

### 1. Tracker（数据追踪）
- 用例：体重、开支、习惯追踪
- 特性：图表、导出、趋势分析
- 状态：✅ 模板完成

### 2. Todo（待办清单）
- 用例：任务管理
- 特性：分类、标签、完成度
- 状态：✅ 模板完成

### 3. Calculator（计算器）
- 用例：BMI、汇率、单位转换
- 特性：历史记录、公式展示
- 状态：⏳ 待开发

### 4. Countdown（倒计时）
- 用例：生日、纪念日、目标日期
- 特性：可视化、提醒
- 状态：⏳ 待开发

### 5. Notes（笔记）
- 用例：快速记录、读书笔记
- 特性：搜索、标签、Markdown
- 状态：⏳ 待开发

## 🚀 部署架构

```
用户输入
  ↓
Web UI (Vercel)
  ↓
/api/generate (Serverless)
  ↓
GLM-5 API (需求解析 + 代码生成)
  ↓
Vercel Deployment API
  ↓
返回PWA链接
  ↓
Supabase (存储记录)
```

## 📊 成功指标

### MVP阶段
- [ ] 生成速度 < 30秒
- [ ] 成功率 > 80%
- [ ] 用户满意度 > 4/5

### 未来目标
- [ ] 生成速度 < 10秒
- [ ] 成功率 > 95%
- [ ] 月活用户 > 1000
- [ ] 生成APP数 > 10000

## 🐛 已知问题

- [ ] API密钥需要环境变量配置
- [ ] 模板代码需要更多测试
- [ ] 部署流程待优化

## 📝 更新日志

### 2026-02-25
- ✅ 项目初始化
- ✅ 基础架构设计
- ✅ 2个模板完成（tracker, todo）
- ✅ Web UI基础界面

---

**Next Step**: 配置Supabase + 集成GLM-5 API
