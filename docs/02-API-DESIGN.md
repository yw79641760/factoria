# Factoria API 设计规范

## 文档信息
- **版本**: 1.0
- **创建日期**: 2026-02-25
- **维护者**: Factoria Team
- **状态**: 🚧 设计中

## 1. API 设计原则

### 1.1 RESTful 规范
- 使用标准 HTTP 方法（GET, POST, PUT, DELETE）
- 资源导向的 URL 设计
- 无状态请求
- 统一的响应格式

### 1.2 版本控制
- 当前版本: `v1`
- URL 中不包含版本号（通过 Header 传递）
- 向后兼容的修改不需要升级版本

### 1.3 响应格式
所有 API 响应统一使用 JSON 格式。

#### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Prompt cannot be empty",
    "details": { ... }
  }
}
```

## 2. API 端点设计

### 2.1 POST /api/generate

#### 2.1.1 功能描述
根据用户输入的自然语言需求，生成一个完整的 PWA 应用。

#### 2.1.2 请求

**URL**: `/api/generate`
**Method**: `POST`
**Content-Type**: `application/json`

**请求体 Schema**:
```typescript
interface GenerateRequest {
  prompt: string;      // 必填：用户需求描述
  userId?: string;     // 可选：用户ID（未来用于个性化）
  options?: {          // 可选：生成选项
    template?: 'tracker' | 'todo' | 'calculator' | 'countdown' | 'notes';
    features?: string[];  // 指定功能特性
    theme?: 'light' | 'dark';  // 主题（未来）
  };
}
```

**请求示例**:
```json
{
  "prompt": "追踪每天喝水量，显示历史记录和趋势图",
  "userId": "user_123",
  "options": {
    "template": "tracker",
    "features": ["chart", "export"]
  }
}
```

#### 2.1.3 响应

**成功响应 (200 OK)**:
```typescript
interface GenerateResponse {
  success: true;
  data: {
    appId: string;        // 生成的APP唯一ID
    url: string;          // 访问URL
    code: string;         // 生成的完整代码
    intent: Intent;       // 解析后的意图
    template: string;     // 使用的模板名称
    deployTime: number;   // 部署耗时（秒）
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
    "code": "import React from 'react';\n...",
    "intent": {
      "type": "tracker",
      "name": "喝水量追踪",
      "fields": [
        {"name": "日期", "type": "date", "required": true},
        {"name": "水量(ml)", "type": "number", "required": true}
      ],
      "features": ["chart", "export"]
    },
    "template": "tracker",
    "deployTime": 25
  }
}
```

**错误响应**:

**400 Bad Request** - 请求参数错误
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Prompt cannot be empty",
    "details": {
      "field": "prompt",
      "constraint": "required"
    }
  }
}
```

**429 Too Many Requests** - 请求频率超限
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 10,
      "window": "1 hour",
      "retryAfter": 3600
    }
  }
}
```

**500 Internal Server Error** - 服务器内部错误
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "requestId": "req_abc123"
    }
  }
}
```

#### 2.1.4 处理流程

```
接收请求
  ↓
验证输入 (prompt 非空, 长度 < 500)
  ↓
调用 NLU 解析 (GLM-5 API)
  ↓
匹配模板
  ↓
生成代码
  ↓
部署到 Vercel
  ↓
存储记录到 Supabase
  ↓
返回响应
```

#### 2.1.5 性能要求
- **响应时间**: < 30秒（95%ile）
- **超时设置**: 客户端 60秒，服务端 50秒
- **重试策略**: 不自动重试，返回错误让用户重试

### 2.2 GET /api/health

#### 2.2.1 功能描述
检查 API 服务健康状态。

#### 2.2.2 请求

**URL**: `/api/health`
**Method**: `GET`
**认证**: 无需认证

#### 2.2.3 响应

**成功响应 (200 OK)**:
```typescript
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    nlu: 'ok' | 'error';
    database: 'ok' | 'error';
    deployment: 'ok' | 'error';
  };
}
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T05:27:35.915Z",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "nlu": "ok",
    "database": "ok",
    "deployment": "ok"
  }
}
```

### 2.3 GET /api/apps/:id (未来)

#### 2.3.1 功能描述
获取已生成的 APP 详情。

#### 2.3.2 请求

**URL**: `/api/apps/:id`
**Method**: `GET`
**认证**: Bearer Token (可选)

#### 2.3.3 响应

**成功响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "app_1771983308548",
    "prompt": "追踪每天喝水量",
    "intent": { ... },
    "url": "https://app-1771983308548.vercel.app",
    "code": "...",
    "status": "ready",
    "createdAt": "2026-02-25T05:00:00.000Z"
  }
}
```

### 2.4 GET /api/apps (未来)

#### 2.4.1 功能描述
获取用户的 APP 列表（分页）。

#### 2.4.2 请求

**URL**: `/api/apps?page=1&limit=10`
**Method**: `GET`
**认证**: Bearer Token

#### 2.4.3 响应

```json
{
  "success": true,
  "data": {
    "apps": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "hasMore": true
    }
  }
}
```

## 3. 数据模型

### 3.1 Intent (意图)

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
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

**示例**:
```json
{
  "type": "tracker",
  "name": "喝水量追踪",
  "description": "记录每天喝水情况",
  "fields": [
    {
      "name": "日期",
      "type": "date",
      "required": true
    },
    {
      "name": "水量(ml)",
      "type": "number",
      "required": true,
      "validation": {
        "min": 0,
        "max": 10000
      }
    }
  ],
  "features": ["chart", "export", "reminder"]
}
```

### 3.2 App (生成的应用)

```typescript
interface App {
  id: string;
  userId?: string;
  prompt: string;
  intent: Intent;
  template: string;
  code: string;
  vercelUrl: string;
  status: 'generating' | 'deploying' | 'ready' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  deployTime?: number;
  error?: string;
}
```

## 4. 错误处理

### 4.1 错误码规范

| 错误码 | HTTP 状态码 | 描述 |
|--------|------------|------|
| `INVALID_INPUT` | 400 | 请求参数无效 |
| `PROMPT_TOO_LONG` | 400 | 需求描述过长 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `NLU_ERROR` | 500 | NLU 解析失败 |
| `TEMPLATE_ERROR` | 500 | 模板处理失败 |
| `DEPLOYMENT_ERROR` | 500 | 部署失败 |
| `DATABASE_ERROR` | 500 | 数据库错误 |
| `INTERNAL_ERROR` | 500 | 内部错误 |

### 4.2 错误响应格式

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

### 4.3 错误处理最佳实践

1. **总是返回有意义的错误消息**
2. **包含 request ID 便于追踪**
3. **不暴露内部实现细节**
4. **提供可操作的建议**

## 5. 认证与授权

### 5.1 当前方案（MVP）
- **无需认证**: 任何人都可以调用 API
- **Rate Limiting**: 基于 IP 限流

### 5.2 未来方案
- **Bearer Token**: 用户登录后获取
- **API Key**: 开发者调用
- **OAuth 2.0**: 第三方应用集成

## 6. Rate Limiting

### 6.1 限流策略

| 端点 | 限制 | 时间窗口 |
|------|------|---------|
| `/api/generate` | 10 次 | 1 小时 |
| `/api/health` | 无限制 | - |
| `/api/apps/*` | 100 次 | 1 小时 |

### 6.2 实现方式

#### 6.2.1 Vercel Edge Functions
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const key = `ratelimit:${ip}`;
  
  // Check rate limit
  const count = await checkRateLimit(key);
  
  if (count > 10) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { status: 429 }
    );
  }
  
  return NextResponse.next();
}
```

#### 6.2.2 响应 Header
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1614250800
```

## 7. 缓存策略

### 7.1 缓存位置
- **CDN 缓存**: Vercel Edge Network
- **应用缓存**: 内存缓存（LRU）

### 7.2 缓存规则

| 资源 | 缓存时间 | 缓存键 |
|------|---------|--------|
| 健康检查 | 不缓存 | - |
| 生成结果 | 不缓存 | - |
| APP 详情 | 5 分钟 | `app:{id}` |
| APP 列表 | 1 分钟 | `apps:{userId}:{page}` |

## 8. 监控与日志

### 8.1 监控指标

| 指标 | 描述 | 目标 |
|------|------|------|
| `request_count` | 请求总数 | - |
| `response_time` | 响应时间 | < 30s |
| `error_rate` | 错误率 | < 5% |
| `success_rate` | 成功率 | > 95% |

### 8.2 日志格式

```json
{
  "timestamp": "2026-02-25T05:27:35.915Z",
  "level": "info",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/generate",
  "ip": "192.168.1.1",
  "userId": "user_123",
  "duration": 2530,
  "status": 200,
  "appId": "app_1771983308548"
}
```

## 9. 测试策略

### 9.1 单元测试
- 测试每个 API 端点的独立功能
- Mock 外部依赖（GLM-5, Vercel API）

### 9.2 集成测试
- 测试完整的请求-响应流程
- 使用真实的数据库（测试环境）

### 9.3 E2E 测试
- 模拟真实用户场景
- 验证生成的 APP 可访问

## 10. API 文档

### 10.1 Swagger/OpenAPI (未来)
- 自动生成 API 文档
- 交互式 API 测试

### 10.2 示例代码

#### cURL
```bash
# 生成 APP
curl -X POST https://api.factoria.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'

# 健康检查
curl https://api.factoria.app/api/health
```

#### JavaScript/TypeScript
```typescript
const response = await fetch('https://api.factoria.app/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: '追踪每天喝水量' })
});

const result = await response.json();
console.log(result.data.url);
```

---

**下一步**: 详细设计数据模型 → [03-DATA-MODEL.md](./03-DATA-MODEL.md)
