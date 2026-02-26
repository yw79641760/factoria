# Factoria 性能优化设计

## 文档信息
- **版本**: 1.0
- **创建日期**: 2026-02-25
- **维护者**: Factoria Team
- **状态**: 🚧 设计中

## 0. 性能定义的本质（重要修正）

### 0.0 性能 ≠ 速度

**传统误区**：
- ❌ 性能 = 生成速度快
- ❌ 性能 = 响应时间短
- ❌ 性能 = 技术指标达标

**正确定义**：
- ✅ 性能 = **用户价值交付能力**
- ✅ 性能 = **需求契合程度**
- ✅ 性能 = **用户使用体验**

### 核心观点

> **"如果生成的APP能完美解决用户痛点的话，生成慢点也是无所谓的"**

### 性能的双重维度

#### 维度1：需求契合度（Requirement Fit）

**定义**：生成的APP功能与用户需求的契合程度

**关键指标**：
- 功能匹配度：APP是否提供了用户需要的功能
- 痛点解决度：APP是否解决了用户的核心问题
- 期望达成度：APP是否达到用户的期望

```typescript
interface RequirementFit {
  featureMatch: number;        // 功能匹配度 (0-1)
  painPointResolution: number; // 痛点解决度 (0-1)
  expectationMet: number;      // 期望达成度 (0-1)
  overallFit: number;          // 综合契合度 (加权平均)
}
```

#### 维度2：使用体验（User Experience）

**定义**：生成的APP在用户使用过程中的整体体验

**关键指标**：
- 易用性：上手难度
- 美观度：视觉设计
- 响应速度：交互流畅度（这是技术性能，但服务于体验）
- 可靠性：稳定性

```typescript
interface UserExperience {
  easeOfUse: number;           // 易用性 (0-1)
  aesthetics: number;          // 美观度 (0-1)
  responsiveness: number;      // 响应速度 (0-1)
  reliability: number;         // 可靠性 (0-1)
  overallExperience: number;   // 综合体验 (加权平均)
}
```

**关系**：
```
需求契合度 → 使用体验
    ↓          ↓
功能价值   感知质量
    ↓          ↓
    → 用户满意度 ←
```

**第1点蕴含在第2点之内**：如果APP不能契合需求，使用体验必然差。

### 性能权衡矩阵

```
需求契合度
    ↑
    │  ★ 理想区
    │  高契合 + 快生成
    │  （目标）
    │
    │         ★ 可接受区
    │         高契合 + 慢生成
    │         （价值优先）
    │
    │  ★ 快速区           ★ 失败区
    │  低契合 + 快生成     低契合 + 慢生成
    │  （无意义）          （最差）
    └──────────────────→ 生成速度
```

### 性能优先级重构

#### ❌ 原优先级（错误）

```
P0: 生成时间 < 30秒
P0: 响应时间 < 1秒
P1: 需求契合度 > 80%
```

#### ✅ 新优先级（正确）

```
P0: 需求契合度 > 90%  （核心价值）
P0: 用户满意度 > 4/5  （价值度量）
P1: 生成时间 < 30秒   （体验优化）
P1: 响应时间 < 1秒    （体验优化）
```

### 性能指标体系

#### 价值性能指标（Value Performance）

**1. 需求契合度**
| 指标 | 目标值 | 衡量方式 | 优先级 |
|------|--------|---------|--------|
| 功能匹配度 | > 90% | 用户反馈 | P0 |
| 痛点解决度 | > 85% | 用户调研 | P0 |
| 期望达成度 | > 80% | 用户问卷 | P0 |

**2. 用户满意度**
| 指标 | 目标值 | 衡量方式 | 优先级 |
|------|--------|---------|--------|
| NPS（净推荐值） | > 50 | 问卷调查 | P0 |
| CSAT（满意度） | > 4.0/5.0 | 用户评分 | P0 |
| 7天留存率 | > 40% | 数据统计 | P1 |

#### 技术性能指标（Technical Performance）

**服务于价值性能**：
| 指标 | 目标值 | 服务于 | 优先级 |
|------|--------|--------|--------|
| 生成时间 | < 30秒 | 用户体验 | P1 |
| 响应时间 | < 1秒 | 交互流畅 | P1 |
| 可用性 | > 99.5% | 可靠性 | P1 |

### 度量方式

#### 需求契合度度量

```typescript
// 生成后立即询问（轻量级）
async function measureRequirementFit(appId: string): Promise<number> {
  const feedback = await askUser({
    question: '这个APP是否符合您的需求？',
    options: [
      { label: '完全符合', score: 1.0 },
      { label: '基本符合', score: 0.8 },
      { label: '部分符合', score: 0.5 },
      { label: '不符合', score: 0.2 }
    ]
  });
  
  return feedback.score;
}
```

#### 用户满意度度量

```typescript
// 使用7天后调查（深度）
async function measureUserSatisfaction(appId: string): Promise<SatisfactionResult> {
  const feedback = await sendSurvey({
    // NPS
    nps: {
      question: '您会推荐这个APP给朋友吗？',
      scale: [0, 10]
    },
    
    // CSAT
    csat: {
      question: '您对这个APP的整体满意度？',
      scale: [1, 5]
    },
    
    // 具体维度
    dimensions: {
      easeOfUse: 'APP是否容易上手？(1-5)',
      aesthetics: 'APP的视觉设计如何？(1-5)',
      functionality: 'APP的功能是否满足需求？(1-5)'
    }
  });
  
  return calculateSatisfaction(feedback);
}
```

### 产品哲学

> **"宁可慢而准确，不可快而无用"**
> 
> **"用户要的是一个好用的APP，不是一个快速生成的垃圾"**

**核心原则**：
1. **价值优先**：先保证有用，再优化速度
2. **用户视角**：从用户价值定义性能
3. **持续改进**：基于反馈迭代优化

### 设计启示

**1. NLU解析要准确**
- 宁可多花时间理解需求
- 不要快速生成错误的功能
- 准确性 > 速度

**2. 模板设计要合理**
- 功能要完整
- 体验要流畅
- 解决真实痛点

**3. 代码生成要高质量**
- 代码质量影响体验
- 不要为了快而牺牲质量
- 长期价值 > 短期速度

---

## 0.1 性能关注的双重维度

Factoria 的性能优化需要关注两个不同的维度：

### 0.1 维度一：平台生成过程性能

**定义**：用户输入需求 → 生成APP → 部署完成的全流程性能

**特点**：
- 一次性成本
- 用户可以等待（< 30秒可接受）
- 影响首次体验

**关键指标**：
- NLU解析时间
- 代码生成时间
- 部署时间
- 总生成时间

### 0.2 维度二：APP（平台产出）运行时性能

**定义**：生成后的APP在用户使用过程中的性能

**特点**：
- 持续成本
- 用户期望高性能（< 1秒响应）
- 影响长期体验

**关键指标**：
- APP响应时间
- 资源占用
- 并发能力
- 用户体验

### 0.3 两者的平衡

```
平台生成性能          APP运行性能
    ↓                     ↓
一次性投入            持续优化
可接受等待            期望即时
影响首次体验          影响长期使用
    ↓                     ↓
优先级：P0            优先级：P0
```

**策略**：
1. 平台生成：优化核心路径，保证 < 30秒
2. APP运行：生成高质量代码，保证 < 1秒响应
3. 资源隔离：防止APP拖垮平台

---

## 0.4 长尾需求的性能策略

**核心洞察**：平台初期，用户需求可能集中在App Store无法满足的长尾需求上。

### 需求分类

| 需求类型 | 生成方式 | 性能目标 | 占比（初期） | 占比（成熟期） |
|---------|---------|---------|-------------|---------------|
| **模板需求** | 模板填充 | < 5秒 | 30% | 80% |
| **长尾需求** | LLM生成 | < 30秒 | 70% | 20% |

### 长尾需求处理流程

```
用户需求（长尾）
    ↓
【第1步：模板匹配】
    检查是否匹配现有模板
    ├─ 匹配 → 使用模板（快）
    └─ 不匹配 → LLM生成（慢）
    ↓
【第2步：LLM生成】
    时间：10-30秒
    特点：
    - 更灵活
    - 更慢
    - 质量可能不如模板
    ↓
【第3步：异步模板化】（后台）
    提取通用模式
    ├─ 识别可参数化部分
    ├─ 创建新模板
    ├─ 人工审核（可选）
    └─ 加入模板库
    ↓
【第4步：后续复用】
    相同需求 → 使用新模板
    生成时间：从30秒降至5秒
```

### 性能目标分层

```typescript
interface PerformanceTarget {
  // 模板需求（快速通道）
  template: {
    generationTime: 5000,     // 5秒
    successRate: 0.95,        // 95%成功率
    codeQuality: 'high'       // 高质量
  };

  // 长尾需求（慢速通道）
  longTail: {
    generationTime: 30000,    // 30秒
    successRate: 0.80,        // 80%成功率
    codeQuality: 'medium'     // 中等质量
  };
}
```

### 成本摊薄策略

```
长尾需求生成成本：
├─ LLM调用：¥0.10/次
├─ 代码生成：2-5秒
└─ 部署：20秒

模板化后成本：
├─ 模板填充：¥0.001/次
├─ 代码生成：< 1秒
└─ 部署：20秒

摊薄效果：
- 第1次：¥0.10
- 第2次：¥0.001（节省99%）
- 第10次：平均¥0.02（节省80%）
```

---

## 0.5 APP依赖平台的风险与隔离

**核心风险**：APP后端依赖平台，可能存在APP侧拖垮平台侧的威胁。

### 风险场景

```
场景1：流量激增
某APP突然爆红 → 请求量激增 → 耗尽平台资源 → 其他APP和平台受影响

场景2：慢查询
某APP设计不当 → 慢SQL查询 → 拖慢数据库 → 影响所有APP

场景3：资源滥用
某APP无限循环 → CPU 100% → 影响同服务器其他APP

场景4：安全攻击
某APP被攻击 → DDoS流量 → 平台被封禁
```

### 隔离架构

```
┌─────────────────────────────────────────────────────────────┐
│                    平台层（Platform Layer）                  │
│  ├─ API生成服务                                              │
│  ├─ 模板管理                                                 │
│  ├─ 用户管理                                                 │
│  └─ 独立资源池 + 高优先级                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ 严格隔离
┌────────────────────┴────────────────────────────────────────┐
│                    APP层（App Layer）                         │
│  ├─ APP 1  ├─ APP 2  ├─ APP 3  ...  ├─ APP N                 │
│  │        │        │              │                          │
│  └─ 独立  └─ 独立  └─ 独立        └─ 独立                     │
│     配额     配额     配额           配额                     │
└─────────────────────────────────────────────────────────────┘
```

### 资源配额限制

```typescript
interface AppQuota {
  // 计算资源
  memory: 256,              // MB
  cpu: 'shared',            // 共享CPU
  maxDuration: 5,           // 最大执行时间（秒）
  
  // 网络资源
  bandwidth: 100,           // MB/月
  requests: 1000,           // 次/天
  
  // 存储资源
  database: 10,             // MB
  storage: 50,              // MB
  
  // 并发限制
  maxConcurrent: 10         // 最大并发数
}

// 超限处理
enum QuotaExceededAction {
  THROTTLE = 'throttle',     // 限流
  REJECT = 'reject',         // 拒绝
  SUSPEND = 'suspend'        // 暂停
}
```

### 自动熔断机制

```typescript
// api/_lib/circuit-breaker.ts

export class AppCircuitBreaker {
  private failures = new Map<string, number>();
  private readonly threshold = 5;  // 5次失败后熔断

  /**
   * 检查APP是否应该被熔断
   */
  shouldCircuitBreak(appId: string): boolean {
    const failures = this.failures.get(appId) || 0;
    return failures >= this.threshold;
  }

  /**
   * 记录失败
   */
  recordFailure(appId: string): void {
    const current = this.failures.get(appId) || 0;
    this.failures.set(appId, current + 1);

    if (current + 1 >= this.threshold) {
      // 触发熔断
      this.triggerCircuitBreak(appId);
    }
  }

  /**
   * 触发熔断
   */
  private async triggerCircuitBreak(appId: string): Promise<void> {
    // 1. 暂停APP
    await this.suspendApp(appId);

    // 2. 发送告警
    await this.sendAlert(appId);

    // 3. 记录日志
    SecurityLogger.log({
      type: 'app_circuit_breaker_triggered',
      severity: 'high',
      details: { appId }
    });
  }
}
```

### 性能监控与隔离

```typescript
// api/_lib/app-monitor.ts

export class AppPerformanceMonitor {
  /**
   * 监控APP性能
   */
  async monitor(appId: string): Promise<PerformanceReport> {
    const metrics = await this.collectMetrics(appId);

    // 检查是否超过阈值
    const violations = this.checkViolations(metrics);

    if (violations.length > 0) {
      // 自动降级或暂停
      await this.handleViolation(appId, violations);
    }

    return { metrics, violations };
  }

  /**
   * 检查违规
   */
  private checkViolations(metrics: AppMetrics): Violation[] {
    const violations: Violation[] = [];

    // 检查响应时间
    if (metrics.avgResponseTime > 5000) {
      violations.push({
        type: 'slow_response',
        severity: 'medium',
        value: metrics.avgResponseTime
      });
    }

    // 检查错误率
    if (metrics.errorRate > 0.1) {
      violations.push({
        type: 'high_error_rate',
        severity: 'high',
        value: metrics.errorRate
      });
    }

    // 检查资源使用
    if (metrics.memoryUsage > 200) {
      violations.push({
        type: 'memory_exceeded',
        severity: 'high',
        value: metrics.memoryUsage
      });
    }

    return violations;
  }
}
```

### 平台保护策略

```typescript
// 平台优先保障

const platformProtection = {
  // 1. 资源预留
  resourceReservation: {
    platform: 0.3,    // 30%资源预留给平台
    apps: 0.7         // 70%资源分配给APP
  },

  // 2. 优先级队列
  priorityQueue: {
    platform: 'high',      // 平台请求高优先级
    templateApp: 'medium', // 模板APP中优先级
    longTailApp: 'low'     // 长尾APP低优先级
  },

  // 3. 降级策略
  degradation: {
    level1: 'limit_long_tail',      // 限制长尾APP
    level2: 'limit_all_apps',       // 限制所有APP
    level3: 'platform_only'         // 仅保留平台
  }
};
```

---

## 1. 性能目标（更新）

### 1.1 MVP阶段目标

#### 平台生成性能

| 指标 | 模板需求 | 长尾需求 | 衡量方式 |
|------|---------|---------|---------|
| **生成时间** | < 5秒 | < 30秒 | Vercel Analytics |
| **成功率** | > 95% | > 80% | 日志统计 |
| **NLU时间** | < 1秒 | < 3秒 | API监控 |
| **部署时间** | < 25秒 | < 25秒 | Vercel日志 |

#### APP运行性能

| 指标 | 目标值 | 衡量方式 |
|------|--------|---------|
| **响应时间** | < 1秒 | Lighthouse |
| **首次加载** | < 2秒 | Lighthouse |
| **并发支持** | 100 QPS | 压力测试 |
| **可用性** | 99.5% | 监控系统 |

### 1.2 性能预算（更新）

```
总响应时间分配：

【模板需求】（< 5秒）
├─ 前端渲染：< 100ms
├─ 网络传输：< 200ms
├─ API处理：< 500ms
├─ NLU解析：< 1秒
├─ 代码生成：< 500ms
├─ 部署：< 25秒（异步）
└─ 数据存储：< 200ms

【长尾需求】（< 30秒）
├─ 前端渲染：< 100ms
├─ 网络传输：< 200ms
├─ API处理：< 500ms
├─ NLU解析：< 3秒
├─ 代码生成：< 5秒（LLM）
├─ 部署：< 25秒（异步）
└─ 数据存储：< 200ms
```

---

## 1. 性能目标

### 1.1 MVP阶段目标

| 指标 | 目标值 | 衡量方式 | 优先级 |
|------|--------|---------|--------|
| **API响应时间** | < 3秒 | Vercel Analytics | P0 |
| **页面首次加载** | < 2秒 | Lighthouse | P0 |
| **生成成功率** | > 80% | 日志统计 | P0 |
| **数据库查询** | < 100ms | Supabase Dashboard | P1 |
| **LLM调用时间** | < 2秒 | API监控 | P1 |
| **部署时间** | < 60秒 | Vercel部署日志 | P2 |

### 1.2 未来目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| API响应时间 | < 1秒 | 优化LLM调用 |
| 页面首次加载 | < 1秒 | CDN优化 |
| 生成成功率 | > 95% | 错误处理改进 |
| 并发支持 | 100 QPS | 水平扩展 |

### 1.3 性能预算

```
总响应时间（30秒）分配：
├─ 前端渲染：< 100ms
├─ 网络传输：< 200ms
├─ API处理：< 500ms
├─ NLU解析（LLM）：< 2秒
├─ 代码生成：< 1秒
├─ Vercel部署：< 25秒
└─ 数据存储：< 200ms
```

---

## 2. 前端性能优化

### 2.1 代码分割与懒加载

```typescript
// web/src/App.tsx

import { lazy, Suspense } from 'react';

// 懒加载组件
const ResultDisplay = lazy(() => import('./components/ResultDisplay'));
const CodePreview = lazy(() => import('./components/CodePreview'));

export default function App() {
  const [result, setResult] = useState<GenerateResult | null>(null);

  return (
    <div>
      <InputForm onSubmit={handleSubmit} />
      
      {/* 懒加载结果组件 */}
      {result && (
        <Suspense fallback={<LoadingSpinner />}>
          <ResultDisplay result={result} />
        </Suspense>
      )}
      
      {/* 懒加载代码预览 */}
      {showCode && (
        <Suspense fallback={<LoadingSpinner />}>
          <CodePreview code={result.code} />
        </Suspense>
      )}
    </div>
  );
}
```

### 2.2 资源优化

#### 2.2.1 图片优化

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // 图片优化
    {
      name: 'image-optimization',
      transform(code, id) {
        if (id.endsWith('.png') || id.endsWith('.jpg')) {
          // 自动压缩图片
          return optimizeImage(code);
        }
      }
    }
  ],
  build: {
    // 图片哈希
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[hash][extname]'
      }
    }
  }
});
```

#### 2.2.2 字体优化

```html
<!-- web/index.html -->

<!-- 预加载关键字体 -->
<link 
  rel="preload" 
  href="/fonts/inter-var.woff2" 
  as="font" 
  type="font/woff2" 
  crossorigin
/>

<!-- 使用系统字体作为备选 -->
<style>
  body {
    font-family: 
      'Inter var', 
      -apple-system, 
      BlinkMacSystemFont, 
      'Segoe UI', 
      sans-serif;
  }
</style>
```

### 2.3 状态管理优化

```typescript
// web/src/hooks/useOptimizedState.ts

import { useState, useCallback, useMemo } from 'react';

/**
 * 优化的状态管理Hook
 */
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);

  // 使用useCallback缓存回调
  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(newState);
  }, []);

  // 使用useMemo缓存计算结果
  const memoizedState = useMemo(() => state, [state]);

  return [memoizedState, optimizedSetState] as const;
}

// 使用示例
function InputForm() {
  const [prompt, setPrompt] = useOptimizedState('');
  
  // 避免不必要的重新渲染
  const handleSubmit = useCallback(() => {
    // 提交逻辑
  }, [prompt]);

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
    </form>
  );
}
```

### 2.4 虚拟化长列表

```typescript
// web/src/components/HistoryList.tsx

import { FixedSizeList } from 'react-window';

/**
 * 虚拟化历史记录列表
 * 只渲染可见项，提高性能
 */
export function HistoryList({ apps }: { apps: App[] }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <AppCard app={apps[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={apps.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 2.5 Web Workers

```typescript
// web/src/workers/codeHighlight.worker.ts

// 将代码高亮移到Web Worker
self.onmessage = (e) => {
  const { code, language } = e.data;
  
  // 使用highlight.js高亮代码
  const highlighted = highlight(code, { language });
  
  self.postMessage(highlighted);
};

// web/src/components/CodePreview.tsx

import { useEffect, useState } from 'react';

export function CodePreview({ code }: { code: string }) {
  const [highlighted, setHighlighted] = useState('');

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/codeHighlight.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.postMessage({ code, language: 'typescript' });
    
    worker.onmessage = (e) => {
      setHighlighted(e.data);
      worker.terminate();
    };

    return () => worker.terminate();
  }, [code]);

  return <pre dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
```

---

## 3. API性能优化

### 3.1 请求并行化

```typescript
// api/generate.ts

export default async function handler(req: Request, res: Response) {
  const { prompt } = req.body;

  // ❌ 串行执行（慢）
  // const intent = await nluProcessor.parse(prompt);
  // const template = await templateMatcher.match(intent);
  // const code = await codeGenerator.generate(intent, template);
  // const deployment = await deployer.deploy(code);

  // ✅ 并行执行（快）
  const [intent, templateConfig] = await Promise.all([
    nluProcessor.parse(prompt),
    templateMatcher.preloadTemplates()  // 预加载模板
  ]);

  // 代码生成和数据库准备并行
  const [code, dbReady] = await Promise.all([
    codeGenerator.generate(intent, templateConfig),
    database.prepareConnection()
  ]);

  // 部署
  const deployment = await deployer.deploy(code);

  return res.json({ ... });
}
```

### 3.2 响应流式传输

```typescript
// api/generate-stream.ts

export default async function handler(req: Request, res: Response) {
  const { prompt } = req.body;

  // 设置SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 1. NLU解析
  res.write(`data: ${JSON.stringify({ stage: 'nlu', status: 'start' })}\n\n`);
  const intent = await nluProcessor.parse(prompt);
  res.write(`data: ${JSON.stringify({ stage: 'nlu', status: 'done', intent })}\n\n`);

  // 2. 代码生成
  res.write(`data: ${JSON.stringify({ stage: 'generation', status: 'start' })}\n\n`);
  const code = await codeGenerator.generate(intent);
  res.write(`data: ${JSON.stringify({ stage: 'generation', status: 'done' })}\n\n`);

  // 3. 部署
  res.write(`data: ${JSON.stringify({ stage: 'deployment', status: 'start' })}\n\n`);
  const deployment = await deployer.deploy(code);
  res.write(`data: ${JSON.stringify({ stage: 'deployment', status: 'done', url: deployment.url })}\n\n`);

  res.end();
}

// 前端接收
const eventSource = new EventSource('/api/generate-stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateProgress(data.stage, data.status);
};
```

### 3.3 请求去重

```typescript
// api/_lib/request-deduplicator.ts

export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * 去重请求
   * 如果相同的请求正在进行中，返回同一个Promise
   */
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // 检查是否有进行中的请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // 创建新请求
    const promise = fn().finally(() => {
      // 完成后移除
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// 使用
const deduplicator = new RequestDeduplicator();

export default async function handler(req: Request, res: Response) {
  const { prompt } = req.body;
  
  // 相同prompt的请求会被去重
  const result = await deduplicator.dedupe(
    `generate:${prompt}`,
    () => generateApp(prompt)
  );

  res.json(result);
}
```

### 3.4 超时控制

```typescript
// api/_lib/timeout.ts

export class TimeoutController {
  /**
   * 带超时的Promise
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      })
    ]);
  }

  /**
   * 带超时的fetch
   */
  static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// 使用
const intent = await TimeoutController.withTimeout(
  nluProcessor.parse(prompt),
  3000,  // 3秒超时
  'NLU parsing timed out'
);
```

---

## 4. 数据库性能优化

### 4.1 索引优化

```sql
-- 已经创建的索引
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_created_at ON apps(created_at DESC);

-- 添加复合索引（常见查询）
CREATE INDEX idx_apps_user_status_created 
  ON apps(user_id, status, created_at DESC);

-- JSONB索引（查询特定类型的APP）
CREATE INDEX idx_apps_intent_type 
  ON apps USING GIN ((intent->'type'));

-- 部分索引（只索引需要的行）
CREATE INDEX idx_apps_active 
  ON apps(created_at DESC) 
  WHERE status = 'ready';

-- 使用EXPLAIN分析查询计划
EXPLAIN ANALYZE 
SELECT * FROM apps 
WHERE user_id = 'user_123' 
  AND status = 'ready' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 4.2 查询优化

```typescript
// api/_lib/database.ts

export class Database {
  /**
   * ✅ 优化：只查询需要的字段
   */
  static async getAppList(userId: string): Promise<AppSummary[]> {
    const { data } = await supabase
      .from('apps')
      .select('id, name, created_at, status, vercel_url')  // 只选择需要的字段
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return data;
  }

  /**
   * ❌ 不优化：查询所有字段
   */
  static async getAppListSlow(userId: string) {
    const { data } = await supabase
      .from('apps')
      .select('*')  // 包含大量code字段
      .eq('user_id', userId);

    return data;
  }

  /**
   * 分页查询
   */
  static async getAppPaginated(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<App>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [dataResult, countResult] = await Promise.all([
      supabase
        .from('apps')
        .select('id, name, created_at, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
      
      supabase
        .from('apps')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    return {
      data: dataResult.data,
      total: countResult.count,
      page,
      pageSize
    };
  }
}
```

### 4.3 连接池管理

```typescript
// api/_lib/database-pool.ts

import { Pool } from 'pg';

export class DatabasePool {
  private static pool: Pool;

  static getInstance(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,  // 最大连接数
        idleTimeoutMillis: 30000,  // 空闲超时
        connectionTimeoutMillis: 2000,  // 连接超时
      });
    }

    return this.pool;
  }

  /**
   * 批量查询
   */
  static async batchQuery<T>(
    queries: Array<{ sql: string; params: any[] }>
  ): Promise<T[]> {
    const client = await this.getInstance().connect();
    
    try {
      await client.query('BEGIN');
      
      const results = await Promise.all(
        queries.map(({ sql, params }) => 
          client.query(sql, params)
        )
      );
      
      await client.query('COMMIT');
      return results.map(r => r.rows);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

---

## 5. 缓存策略

### 5.1 多层缓存架构

```
┌─────────────────────────────────────────────────────────────┐
│                  第1层：浏览器缓存                             │
│  Cache-Control headers                                       │
│  适用：静态资源、CDN资源                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  第2层：CDN缓存                                │
│  Vercel Edge Network                                         │
│  适用：静态页面、API响应                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  第3层：应用缓存                               │
│  Redis / Upstash                                             │
│  适用：模板、配置、会话数据                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  第4层：数据库缓存                             │
│  Supabase内置缓存                                            │
│  适用：查询结果                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 浏览器缓存

```typescript
// api/_middleware.ts

export function middleware(req: Request, res: Response, next: Function) {
  // 静态资源缓存1年
  if (req.path.match(/\.(js|css|png|jpg|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // API响应缓存5分钟
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  }

  // HTML不缓存
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache');
  }

  next();
}
```

### 5.3 Redis缓存

```typescript
// api/_lib/cache.ts

import { Redis } from '@upstash/redis';

export class Cache {
  private static redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
  });

  /**
   * 获取或设置缓存
   */
  static async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 3600  // 默认1小时
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.redis.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // 执行函数
    const result = await fn();

    // 存入缓存
    await this.redis.setex(key, ttl, JSON.stringify(result));

    return result;
  }

  /**
   * 缓存模板
   */
  static async cacheTemplate(type: string, template: string): Promise<void> {
    await this.redis.set(`template:${type}`, template, { ex: 86400 });  // 1天
  }

  /**
   * 获取模板
   */
  static async getTemplate(type: string): Promise<string | null> {
    return await this.redis.get(`template:${type}`);
  }

  /**
   * 清除缓存
   */
  static async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// 使用
const template = await Cache.getOrSet(
  `template:${intent.type}`,
  () => loadTemplate(intent.type),
  86400  // 缓存1天
);
```

### 5.4 模板预加载

```typescript
// api/_lib/template-preloader.ts

export class TemplatePreloader {
  private static templates = new Map<string, string>();

  /**
   * 启动时预加载所有模板
   */
  static async preload(): Promise<void> {
    const types = ['tracker', 'todo', 'calculator', 'countdown', 'notes'];

    await Promise.all(
      types.map(async (type) => {
        const template = await fs.readFile(
          `./templates/${type}.tsx`,
          'utf-8'
        );
        
        this.templates.set(type, template);
        
        // 同时缓存到Redis
        await Cache.cacheTemplate(type, template);
      })
    );

    console.log(`Preloaded ${types.length} templates`);
  }

  /**
   * 获取模板（优先内存，其次Redis）
   */
  static async get(type: string): Promise<string> {
    // 1. 检查内存缓存
    if (this.templates.has(type)) {
      return this.templates.get(type)!;
    }

    // 2. 检查Redis缓存
    const cached = await Cache.getTemplate(type);
    if (cached) {
      this.templates.set(type, cached);
      return cached;
    }

    // 3. 从文件加载
    const template = await fs.readFile(`./templates/${type}.tsx`, 'utf-8');
    this.templates.set(type, template);
    
    return template;
  }
}

// 启动时调用
TemplatePreloader.preload();
```

---

## 6. 资源优化

### 6.1 Bundle大小优化

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方库分离
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['tailwindcss'],
        }
      }
    },
    
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除console
        drop_debugger: true  // 移除debugger
      }
    },
    
    // 资源内联阈值
    assetsInlineLimit: 4096,  // <4KB的资源内联
    
    // CSS代码分割
    cssCodeSplit: true
  },

  // 依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

### 6.2 Tree Shaking

```typescript
// ❌ 不好的导入方式（无法Tree Shaking）
import _ from 'lodash';

// ✅ 好的导入方式（支持Tree Shaking）
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// 或者使用lodash-es
import { debounce, throttle } from 'lodash-es';
```

### 6.3 动态导入

```typescript
// web/src/App.tsx

// ❌ 静态导入（增加初始bundle大小）
import { Chart } from 'recharts';

// ✅ 动态导入（按需加载）
const Chart = lazy(() => import('recharts').then(m => ({ default: m.Chart })));

// 条件导入
async function loadMarkdownParser() {
  if (needsMarkdown) {
    const { marked } = await import('marked');
    return marked;
  }
}
```

---

## 7. 监控与调优

### 7.1 性能监控

```typescript
// api/_lib/performance-monitor.ts

export class PerformanceMonitor {
  /**
   * 记录性能指标
   */
  static recordMetric(
    name: string,
    duration: number,
    metadata?: any
  ): void {
    const metric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    // 发送到监控系统
    this.sendToAnalytics(metric);

    // 检查是否超过阈值
    if (duration > this.getThreshold(name)) {
      this.sendAlert(metric);
    }
  }

  /**
   * 性能计时装饰器
   */
  static measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        PerformanceMonitor.recordMetric(
          `${target.constructor.name}.${propertyKey}`,
          Date.now() - start
        );
        
        return result;
      } catch (error) {
        PerformanceMonitor.recordMetric(
          `${target.constructor.name}.${propertyKey}.error`,
          Date.now() - start
        );
        
        throw error;
      }
    };

    return descriptor;
  }
}

// 使用装饰器
class NLUProcessor {
  @PerformanceMonitor.measure
  async parse(prompt: string): Promise<Intent> {
    // ...
  }
}
```

### 7.2 慢查询分析

```typescript
// api/_lib/slow-query-logger.ts

export class SlowQueryLogger {
  private static threshold = 100;  // 100ms

  /**
   * 记录慢查询
   */
  static logSlowQuery(
    query: string,
    duration: number,
    params?: any[]
  ): void {
    if (duration > this.threshold) {
      console.warn('Slow query detected:', {
        query,
        duration,
        params,
        timestamp: new Date().toISOString()
      });

      // 发送告警
      this.sendAlert({ query, duration, params });
    }
  }
}

// 在Supabase客户端中使用
const supabaseWithLogging = {
  ...supabase,
  from: (table: string) => {
    const start = Date.now();
    
    const queryBuilder = supabase.from(table);
    
    // 包装查询方法
    const originalThen = queryBuilder.then;
    queryBuilder.then = function(...args) {
      const duration = Date.now() - start;
      SlowQueryLogger.logSlowQuery(`SELECT from ${table}`, duration);
      return originalThen.apply(this, args);
    };
    
    return queryBuilder;
  }
};
```

### 7.3 实时性能仪表板

```typescript
// api/_lib/dashboard.ts

export class PerformanceDashboard {
  /**
   * 获取性能统计
   */
  static getStats(): PerformanceStats {
    return {
      // API性能
      api: {
        averageResponseTime: this.getAverageResponseTime(),
        p95ResponseTime: this.getP95ResponseTime(),
        errorRate: this.getErrorRate(),
        requestsPerMinute: this.getRequestsPerMinute()
      },

      // 数据库性能
      database: {
        averageQueryTime: this.getAverageQueryTime(),
        slowQueries: this.getSlowQueriesCount(),
        connectionPoolUsage: this.getConnectionPoolUsage()
      },

      // 缓存性能
      cache: {
        hitRate: this.getCacheHitRate(),
        missRate: this.getCacheMissRate()
      },

      // LLM性能
      llm: {
        averageGenerationTime: this.getAverageLLMTime(),
        tokenUsage: this.getTokenUsage()
      }
    };
  }

  /**
   * 性能健康检查
   */
  static async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkAPIHealth(),
      this.checkDatabaseHealth(),
      this.checkCacheHealth(),
      this.checkLLMHealth()
    ]);

    return {
      status: checks.every(c => c.healthy) ? 'healthy' : 'degraded',
      checks
    };
  }
}

// API端点
app.get('/api/dashboard/performance', (req, res) => {
  res.json(PerformanceDashboard.getStats());
});

app.get('/api/dashboard/health', async (req, res) => {
  res.json(await PerformanceDashboard.healthCheck());
});
```

---

## 8. 性能测试

### 8.1 负载测试

```typescript
// tests/performance/load-test.ts

import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // 10 VUs
    { duration: '5m', target: 50 },   // 增加到50 VUs
    { duration: '2m', target: 100 },  // 增加到100 VUs
    { duration: '2m', target: 0 },    // 减少到0
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95%请求<3秒
    http_req_failed: ['rate<0.05'],     // 错误率<5%
  },
};

export default function () {
  const payload = JSON.stringify({
    prompt: '追踪每天喝水量'
  });

  const res = http.post('https://factoria.app/api/generate', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'has app ID': (r) => JSON.parse(r.body).data?.appId !== undefined,
  });
}
```

### 8.2 压力测试

```typescript
// tests/performance/stress-test.ts

import { check } from 'k6';

export let options = {
  // 持续高负载
  duration: '10m',
  vus: 200,

  thresholds: {
    http_req_duration: ['p(99)<5000'],  // 99%请求<5秒
  },
};

export default function () {
  // 测试并发生成
  const res = http.post('https://factoria.app/api/generate', {
    prompt: `测试追踪器 ${Date.now()}`
  });

  check(res, {
    'success': (r) => r.status === 200 || r.status === 429,  // 允许限流
  });
}
```

### 8.3 性能基准测试

```typescript
// tests/performance/benchmark.ts

describe('Performance Benchmarks', () => {
  test('NLU parsing should complete in < 2 seconds', async () => {
    const start = Date.now();
    
    await nluProcessor.parse('追踪每天喝水量');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  test('Code generation should complete in < 1 second', async () => {
    const intent = { type: 'tracker', name: 'Test' };
    
    const start = Date.now();
    
    await codeGenerator.generate(intent);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('Database query should complete in < 100ms', async () => {
    const start = Date.now();
    
    await Database.getApp('app_123');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

---

## 9. 性能优化清单

### 9.1 前端优化

- [ ] 代码分割和懒加载
- [ ] 图片优化（WebP、压缩）
- [ ] 字体优化（预加载、woff2）
- [ ] 虚拟化长列表
- [ ] Web Workers处理重计算
- [ ] Service Worker缓存
- [ ] 关键CSS内联
- [ ] 资源预加载

### 9.2 API优化

- [ ] 请求并行化
- [ ] 响应流式传输
- [ ] 请求去重
- [ ] 超时控制
- [ ] GraphQL（未来）
- [ ] 批量API

### 9.3 数据库优化

- [ ] 创建合适的索引
- [ ] 查询字段优化
- [ ] 分页查询
- [ ] 连接池管理
- [ ] 查询缓存
- [ ] 批量操作

### 9.4 缓存优化

- [ ] 浏览器缓存
- [ ] CDN缓存
- [ ] Redis缓存
- [ ] 模板预加载
- [ ] 查询结果缓存
- [ ] 缓存失效策略

### 9.5 资源优化

- [ ] Bundle大小优化
- [ ] Tree Shaking
- [ ] 动态导入
- [ ] 代码压缩
- [ ] 图片懒加载
- [ ] 资源哈希

### 9.6 监控优化

- [ ] 性能监控
- [ ] 慢查询日志
- [ ] 实时仪表板
- [ ] 告警系统
- [ ] APM集成

---

## 10. 性能优化优先级

### P0 (MVP必须)
1. ✅ API响应时间 < 3秒
2. ✅ 页面首次加载 < 2秒
3. ✅ 数据库查询 < 100ms
4. ✅ 基础缓存策略

### P1 (优先)
1. ⏳ 请求并行化
2. ⏳ 模板预加载
3. ⏳ 性能监控
4. ⏳ 负载测试

### P2 (未来)
1. 📅 响应流式传输
2. 📅 Web Workers
3. 📅 Service Worker
4. 📅 全球CDN优化

---

**性能优化设计完成！** 🚀

**总结**：
- **目标**: API < 3秒, 页面 < 2秒
- **策略**: 多层缓存、并行处理、资源优化
- **监控**: 实时性能仪表板、慢查询日志
- **测试**: 负载测试、压力测试、基准测试

**下一步**: 开始编码实现！💪
