# Factoria API 设计规范 v2.0

## 文档信息
- **版本**: 2.0（能力驱动）
- **创建日期**: 2026-02-26
- **维护者**: Factoria Team
- **状态**: 🎯 设计中

## 核心理念

**Agent-Native Software = Framework(Abilities Orchestrated by LLM)**

API设计原则：
1. **能力导向** - API围绕能力（Abilities）设计
2. **编排透明** - 提供编排过程的可见性
3. **向后兼容** - 核心API保持兼容性
4. **渐进增强** - 新功能通过新字段/新端点提供

---

## 1. 核心API

### 1.1 POST /api/generate

生成应用的主API。

#### 1.1.1 请求

**URL**: `/api/generate`
**Method**: `POST`
**Content-Type**: `application/json`

**请求体**:
```typescript
interface GenerateRequest {
  prompt: string;      // 必填：用户需求描述
  userId?: string;     // 可选：用户ID（未来用于个性化）
  options?: {          // 可选：生成选项
    framework?: 'web' | 'pwa' | 'mobile';  // 框架类型（默认web）
    abilities?: string[];   // 指定能力（可选）
    metadata?: Record<string, any>;  // 元数据
  };
}
```

**请求示例**:
```json
{
  "prompt": "做一个BMI计算器",
  "options": {
    "framework": "web"
  }
}
```

#### 1.1.2 响应

**成功响应 (200 OK)**:
```typescript
interface GenerateResponse {
  success: true;
  data: {
    // === 应用信息 ===
    appId: string;              // 生成的应用ID
    url: string;                // 访问URL
    code: string;               // 生成的编排代码
    
    // === 意图信息 ===
    intent: {
      type: string;             // 意图类型（如calculator）
      name: string;             // 应用名称
      description?: string;     // 应用描述
      confidence: number;       // 解析置信度 (0-1)
    };
    
    // === 能力信息 ===
    abilities: Array<{
      name: string;             // 能力名称
      type: 'pure' | 'ai' | 'api' | 'device';  // 能力类型
      functions: string[];      // 使用的函数
      reason: string;           // 为什么需要这个能力
    }>;
    
    // === 编排信息 ===
    orchestration: {
      source: 'user_input' | 'prd' | 'data_mining';  // 业务逻辑来源
      generatedAt: string;      // 生成时间
      duration: number;         // 生成耗时（毫秒）
    };
    
    // === 部署信息 ===
    deployment: {
      status: 'deploying' | 'ready' | 'failed';
      estimatedTime: number;    // 预计部署时间（秒）
    };
  };
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "appId": "app_1771983308548",
    "url": "https://app-1771983308548.vercel.app",
    "code": "import { Framework } from '@factoria/core';\nimport { math, format } from '@factoria/abilities';\n\nexport default Framework.define({\n  name: 'BMI计算器',\n  inputs: [\n    { name: '身高', type: 'number', unit: 'cm' },\n    { name: '体重', type: 'number', unit: 'kg' }\n  ],\n  compute: (inputs, abilities) => {\n    const { math, format } = abilities;\n    const height = math.divide(inputs.身高, 100);\n    const bmi = math.divide(inputs.体重, math.pow(height, 2));\n    return { bmi: format.number(bmi, 2) };\n  },\n  display: (result) => <div>{result.bmi}</div>\n});",
    
    "intent": {
      "type": "calculator",
      "name": "BMI计算器",
      "description": "计算身体质量指数",
      "confidence": 0.95
    },
    
    "abilities": [
      {
        "name": "math",
        "type": "pure",
        "functions": ["divide", "pow"],
        "reason": "需要进行数学计算"
      },
      {
        "name": "format",
        "type": "pure",
        "functions": ["number"],
        "reason": "需要格式化结果"
      }
    ],
    
    "orchestration": {
      "source": "user_input",
      "generatedAt": "2026-02-26T00:00:00Z",
      "duration": 2500
    },
    
    "deployment": {
      "status": "deploying",
      "estimatedTime": 25
    }
  }
}
```

**错误响应**:
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**错误示例**:
```json
{
  "success": false,
  "error": {
    "code": "ABILITY_NOT_AVAILABLE",
    "message": "Required ability 'vision' is not available",
    "details": {
      "ability": "vision",
      "required": true,
      "available": ["math", "format", "http", "storage"]
    }
  }
}
```

#### 1.1.3 处理流程

```
接收请求
  ↓
【Step 1: 输入验证】
  - prompt 非空检查
  - 长度限制 (1-500字符)
  - 内容安全检查
  ↓
【Step 2: 需求理解（NLU）】
  - GLM-5 解析用户意图
  - 识别应用类型
  - 提取关键信息
  ↓
【Step 3: 能力识别】
  - 分析需要哪些能力
  - 检查能力是否可用
  - 生成能力清单
  ↓
【Step 4: 编排生成】
  - GLM-5 生成编排代码
  - 代码验证
  - 代码优化
  ↓
【Step 5: 部署】
  - 创建应用实例
  - 部署到 Vercel
  - 返回访问URL
  ↓
【Step 6: 存储记录】
  - 保存到 Supabase
  - 记录能力使用
  - 记录编排信息
  ↓
返回响应
```

#### 1.1.4 性能要求

- **响应时间**: < 5秒（编排生成） + 部署时间（异步）
- **超时设置**: 客户端 60秒
- **并发支持**: 100 QPS

---

### 1.2 GET /api/health

健康检查API。

#### 1.2.1 请求

**URL**: `/api/health`
**Method**: `GET`

#### 1.2.2 响应

```typescript
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    orchestration: 'ok' | 'error';      // 编排服务
    abilities: 'ok' | 'error';          // 能力库
    database: 'ok' | 'error';           // 数据库
    deployment: 'ok' | 'error';         // 部署服务
  };
  capabilities: {
    totalAbilities: number;             // 可用能力总数
    orchestrationEngine: string;        // 编排引擎版本
    frameworkVersion: string;           // 框架版本
  };
}
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-26T00:00:00Z",
  "version": "2.0.0",
  "uptime": 86400,
  "services": {
    "orchestration": "ok",
    "abilities": "ok",
    "database": "ok",
    "deployment": "ok"
  },
  "capabilities": {
    "totalAbilities": 7,
    "orchestrationEngine": "glm-5",
    "frameworkVersion": "2.0.0"
  }
}
```

---

## 2. 能力管理API

### 2.1 GET /api/abilities

获取所有可用能力。

#### 2.1.1 请求

**URL**: `/api/abilities`
**Method**: `GET`
**Query参数**:
- `type`: 能力类型过滤（可选）
- `search`: 搜索关键词（可选）

#### 2.1.2 响应

```typescript
interface AbilitiesResponse {
  success: true;
  data: {
    abilities: Array<{
      name: string;
      type: 'pure' | 'ai' | 'api' | 'device';
      description: string;
      functions: string[];
      metadata?: {
        accuracy?: number;      // AI能力的准确率
        latency?: number;       // 平均延迟（毫秒）
        dependencies?: string[]; // 依赖的其他能力
      };
      examples?: Array<{
        description: string;
        code: string;
      }>;
    }>;
    total: number;
    filtered: number;
  };
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "abilities": [
      {
        "name": "math",
        "type": "pure",
        "description": "数学计算能力",
        "functions": [
          "add",
          "subtract",
          "multiply",
          "divide",
          "pow",
          "sqrt",
          "abs",
          "round"
        ],
        "metadata": {
          "accuracy": 1.0,
          "latency": 0
        },
        "examples": [
          {
            "description": "计算BMI",
            "code": "const bmi = math.divide(weight, math.pow(height, 2));"
          }
        ]
      },
      {
        "name": "format",
        "type": "pure",
        "description": "数据格式化能力",
        "functions": [
          "number",
          "currency",
          "date",
          "percentage"
        ],
        "metadata": {
          "accuracy": 1.0,
          "latency": 0
        }
      },
      {
        "name": "http",
        "type": "api",
        "description": "HTTP请求能力",
        "functions": [
          "get",
          "post"
        ],
        "metadata": {
          "latency": 200
        }
      },
      {
        "name": "storage",
        "type": "api",
        "description": "本地存储能力",
        "functions": [
          "get",
          "set",
          "remove",
          "clear"
        ],
        "metadata": {
          "latency": 10
        }
      },
      {
        "name": "geolocation",
        "type": "device",
        "description": "地理位置能力",
        "functions": [
          "getCurrentPosition",
          "watchPosition",
          "clearWatch"
        ],
        "metadata": {
          "latency": 1000
        }
      }
    ],
    "total": 5,
    "filtered": 5
  }
}
```

---

### 2.2 GET /api/abilities/:name

获取特定能力的详细信息。

#### 2.2.1 请求

**URL**: `/api/abilities/:name`
**Method**: `GET`

#### 2.2.2 响应

```typescript
interface AbilityDetailResponse {
  success: true;
  data: {
    name: string;
    type: 'pure' | 'ai' | 'api' | 'device';
    description: string;
    functions: Record<string, {
      signature: string;        // 函数签名
      description: string;      // 函数描述
      params?: Record<string, {
        type: string;
        description: string;
        required: boolean;
      }>;
      returns: {
        type: string;
        description: string;
      };
      throws?: string;          // 可能抛出的异常
      examples: Array<{
        input: any;
        output: any;
        description: string;
      }>;
    }>;
    metadata: {
      accuracy?: number;
      latency?: number;
      dependencies?: string[];
      version: string;
      author: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "name": "math",
    "type": "pure",
    "description": "数学计算能力",
    "functions": {
      "add": {
        "signature": "(a: number, b: number) => number",
        "description": "加法运算",
        "params": {
          "a": {
            "type": "number",
            "description": "第一个加数",
            "required": true
          },
          "b": {
            "type": "number",
            "description": "第二个加数",
            "required": true
          }
        },
        "returns": {
          "type": "number",
          "description": "两数之和"
        },
        "examples": [
          {
            "input": { "a": 1, "b": 2 },
            "output": 3,
            "description": "简单加法"
          }
        ]
      },
      "divide": {
        "signature": "(a: number, b: number) => number",
        "description": "除法运算",
        "params": {
          "a": {
            "type": "number",
            "description": "被除数",
            "required": true
          },
          "b": {
            "type": "number",
            "description": "除数（不能为0）",
            "required": true
          }
        },
        "returns": {
          "type": "number",
          "description": "商"
        },
        "throws": "Division by zero",
        "examples": [
          {
            "input": { "a": 10, "b": 2 },
            "output": 5,
            "description": "简单除法"
          },
          {
            "input": { "a": 10, "b": 0 },
            "output": "Error: Division by zero",
            "description": "除零错误"
          }
        ]
      }
    },
    "metadata": {
      "accuracy": 1.0,
      "latency": 0,
      "version": "1.0.0",
      "author": "factoria",
      "createdAt": "2026-02-26T00:00:00Z",
      "updatedAt": "2026-02-26T00:00:00Z"
    }
  }
}
```

---

## 3. 编排管理API

### 3.1 POST /api/orchestrate/preview

预览编排逻辑，不实际生成应用。

#### 3.1.1 请求

**URL**: `/api/orchestrate/preview`
**Method**: `POST`
**Content-Type**: `application/json`

**请求体**:
```typescript
interface OrchestratePreviewRequest {
  prompt: string;
  detailed?: boolean;  // 是否返回详细信息（默认false）
}
```

#### 3.1.2 响应

```typescript
interface OrchestratePreviewResponse {
  success: true;
  data: {
    // === 意图信息 ===
    intent: {
      type: string;
      name: string;
      description?: string;
      confidence: number;
    };
    
    // === 能力分析 ===
    abilities: Array<{
      name: string;
      type: 'pure' | 'ai' | 'api' | 'device';
      functions: string[];
      reason: string;
      confidence: number;  // LLM对这个能力的置信度
    }>;
    
    // === 编排代码预览 ===
    orchestrationCode: string;
    
    // === 输入输出分析 ===
    inputs: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: any;
    }>;
    
    outputs: {
      type: string;
      description: string;
    };
    
    // === 预估信息 ===
    estimation: {
      generationTime: number;  // 预计生成时间（秒）
      deploymentTime: number;  // 预计部署时间（秒）
      complexity: 'low' | 'medium' | 'high';  // 复杂度
    };
    
    // === 建议 ===
    suggestions?: Array<{
      type: 'optimization' | 'alternative' | 'warning';
      message: string;
    }>;
  };
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "intent": {
      "type": "calculator",
      "name": "BMI计算器",
      "description": "计算身体质量指数",
      "confidence": 0.95
    },
    
    "abilities": [
      {
        "name": "math",
        "type": "pure",
        "functions": ["divide", "pow"],
        "reason": "需要进行BMI计算（除法和乘方）",
        "confidence": 0.98
      },
      {
        "name": "format",
        "type": "pure",
        "functions": ["number"],
        "reason": "需要格式化计算结果",
        "confidence": 0.92
      }
    ],
    
    "orchestrationCode": "Framework.define({\n  name: 'BMI计算器',\n  inputs: [...],\n  compute: (inputs, abilities) => {...},\n  display: (result) => <div>...</div>\n})",
    
    "inputs": [
      {
        "name": "身高",
        "type": "number",
        "required": true,
        "defaultValue": null
      },
      {
        "name": "体重",
        "type": "number",
        "required": true,
        "defaultValue": null
      }
    ],
    
    "outputs": {
      "type": "object",
      "description": "包含bmi数值和分类信息"
    },
    
    "estimation": {
      "generationTime": 3,
      "deploymentTime": 25,
      "complexity": "low"
    },
    
    "suggestions": [
      {
        "type": "optimization",
        "message": "可以添加历史记录功能，使用storage能力"
      }
    ]
  }
}
```

---

### 3.2 GET /api/orchestrate/history

获取编排历史记录。

#### 3.2.1 请求

**URL**: `/api/orchestrate/history`
**Method**: `GET`
**Query参数**:
- `userId`: 用户ID（可选）
- `limit`: 返回数量（默认20）
- `offset`: 偏移量（默认0）

#### 3.2.2 响应

```typescript
interface OrchestrateHistoryResponse {
  success: true;
  data: {
    items: Array<{
      id: string;
      prompt: string;
      intent: {
        type: string;
        name: string;
      };
      abilities: string[];
      orchestration: {
        source: string;
        generatedAt: string;
        duration: number;
      };
      appId?: string;  // 如果已生成应用
      success: boolean;
    }>;
    total: number;
    limit: number;
    offset: number;
  };
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "orch_123",
        "prompt": "做一个BMI计算器",
        "intent": {
          "type": "calculator",
          "name": "BMI计算器"
        },
        "abilities": ["math", "format"],
        "orchestration": {
          "source": "user_input",
          "generatedAt": "2026-02-26T00:00:00Z",
          "duration": 2500
        },
        "appId": "app_123",
        "success": true
      }
    ],
    "total": 10,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 4. 应用管理API

### 4.1 GET /api/apps/:id

获取应用详情。

#### 4.1.1 请求

**URL**: `/api/apps/:id`
**Method**: `GET`

#### 4.1.2 响应

```typescript
interface AppDetailResponse {
  success: true;
  data: {
    id: string;
    url: string;
    code: string;
    intent: {
      type: string;
      name: string;
      description?: string;
    };
    abilities: Array<{
      name: string;
      type: string;
      functions: string[];
    }>;
    orchestration: {
      source: string;
      generatedAt: string;
      duration: number;
    };
    status: 'generating' | 'deploying' | 'ready' | 'failed' | 'expired';
    createdAt: string;
    updatedAt: string;
    deployTime?: number;
    error?: string;
  };
}
```

---

### 4.2 GET /api/apps

获取应用列表。

#### 4.2.1 请求

**URL**: `/api/apps`
**Method**: `GET`
**Query参数**:
- `userId`: 用户ID（可选）
- `status`: 状态过滤（可选）
- `ability`: 能力过滤（可选）
- `limit`: 返回数量（默认20）
- `offset`: 偏移量（默认0）

#### 4.2.2 响应

```typescript
interface AppListResponse {
  success: true;
  data: {
    apps: Array<{
      id: string;
      url: string;
      intent: {
        type: string;
        name: string;
      };
      abilities: string[];
      status: string;
      createdAt: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

## 5. 错误处理

### 5.1 错误码规范

| 错误码 | HTTP状态码 | 描述 |
|--------|-----------|------|
| `INVALID_INPUT` | 400 | 请求参数无效 |
| `PROMPT_TOO_LONG` | 400 | 需求描述过长 |
| `ABILITY_NOT_AVAILABLE` | 400 | 所需能力不可用 |
| `ORCHESTRATION_FAILED` | 500 | 编排生成失败 |
| `DEPLOYMENT_FAILED` | 500 | 部署失败 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 内部错误 |

### 5.2 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}
```

---

## 6. Rate Limiting

### 6.1 限制规则

| 端点 | 限制 | 时间窗口 |
|------|------|---------|
| `/api/generate` | 10次 | 1小时 |
| `/api/orchestrate/preview` | 20次 | 1小时 |
| `/api/abilities/*` | 100次 | 1小时 |
| `/api/apps/*` | 100次 | 1小时 |

### 6.2 响应Header

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1614250800
```

---

## 7. 版本控制

### 7.1 API版本

- **当前版本**: v2.0
- **版本前缀**: `/api/v2/`（可选，默认使用最新版本）
- **向后兼容**: 保持1年

### 7.2 版本迁移

**从v1.0迁移到v2.0**:
- 核心端点（`/api/generate`）保持兼容
- 响应增加新字段
- 新端点（`/api/abilities`, `/api/orchestrate`）为新增功能

---

## 8. 示例

### 8.1 完整生成流程

```bash
# 1. 查看可用能力
curl https://api.factoria.app/api/abilities

# 2. 预览编排
curl -X POST https://api.factoria.app/api/orchestrate/preview \
  -H "Content-Type: application/json" \
  -d '{"prompt":"做一个BMI计算器"}'

# 3. 生成应用
curl -X POST https://api.factoria.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"做一个BMI计算器"}'

# 4. 查看应用详情
curl https://api.factoria.app/api/apps/app_123
```

### 8.2 使用指定能力

```bash
curl -X POST https://api.factoria.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "做一个汇率转换器",
    "options": {
      "abilities": ["http", "math", "format"]
    }
  }'
```

---

## 9. 未来扩展

### 9.1 能力注册API（Phase 3）

```typescript
POST /api/abilities
{
  "name": "weather",
  "type": "api",
  "description": "天气查询能力",
  "functions": {
    "getCurrent": {
      "params": { "city": "string" },
      "returns": "WeatherInfo"
    }
  },
  "config": {
    "apiKey": "xxx",
    "baseUrl": "https://api.weather.com"
  }
}
```

### 9.2 编排优化API（Phase 3）

```typescript
POST /api/orchestrate/optimize
{
  "appId": "app_123",
  "goals": ["performance", "accuracy"]
}
```

---

**API版本**: 2.0
**核心变化**: 从模板驱动 → 能力驱动
**新增**: 能力管理API、编排管理API
