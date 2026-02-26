# Factoria 数据模型设计

## 文档信息
- **版本**: 1.0
- **创建日期**: 2026-02-25
- **维护者**: Factoria Team
- **状态**: 🚧 设计中

## 1. 数据模型概述

Factoria 的数据模型采用 **PostgreSQL** 关系型数据库，通过 **Supabase** 提供服务。核心设计原则：

1. **简洁性** - MVP阶段只保留必要字段
2. **可扩展性** - 为未来功能预留字段
3. **一致性** - 统一的命名和类型规范
4. **性能优化** - 合理的索引设计

### 1.1 核心实体关系

```
┌─────────────┐
│    User     │ (未来)
│  (用户)     │
└──────┬──────┘
       │ 1:N
       │
┌──────┴──────┐
│     App     │
│  (生成的应用) │
└──────┬──────┘
       │ 1:1
       │
┌──────┴──────┐
│   Intent    │
│  (意图解析)  │
└─────────────┘
```

## 2. 核心数据模型

### 2.1 Intent (意图)

Intent 是 NLU 解析的结果，描述用户想要生成的APP类型和参数。

#### 2.1.1 TypeScript 接口

```typescript
interface Intent {
  type: 'tracker' | 'todo' | 'calculator' | 'countdown' | 'notes';
  name: string;
  description?: string;
  fields?: Field[];
  features?: string[];
  confidence?: number;  // 解析置信度 (0-1)
}

interface Field {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];  // for select type
  validation?: FieldValidation;
  defaultValue?: any;
  placeholder?: string;
}

interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;  // 正则表达式
  minLength?: number;
  maxLength?: number;
}
```

#### 2.1.2 字段说明

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `type` | enum | 是 | APP类型（5种基础模板） |
| `name` | string | 是 | APP名称 |
| `description` | string | 否 | APP描述 |
| `fields` | Field[] | 否 | 数据字段定义 |
| `features` | string[] | 否 | 功能特性列表 |
| `confidence` | number | 否 | NLU解析置信度 |

#### 2.1.3 示例数据

**示例1: Tracker (数据追踪)**
```json
{
  "type": "tracker",
  "name": "喝水量追踪",
  "description": "记录每天喝水情况，显示趋势图",
  "fields": [
    {
      "name": "日期",
      "type": "date",
      "required": true,
      "defaultValue": "today"
    },
    {
      "name": "水量(ml)",
      "type": "number",
      "required": true,
      "validation": {
        "min": 0,
        "max": 10000
      },
      "placeholder": "例如: 250"
    },
    {
      "name": "备注",
      "type": "textarea",
      "required": false,
      "validation": {
        "maxLength": 500
      }
    }
  ],
  "features": ["chart", "export", "reminder"],
  "confidence": 0.95
}
```

**示例2: Todo (待办清单)**
```json
{
  "type": "todo",
  "name": "工作任务清单",
  "description": "管理日常工作任务",
  "fields": [
    {
      "name": "任务名称",
      "type": "text",
      "required": true,
      "validation": {
        "maxLength": 200
      }
    },
    {
      "name": "优先级",
      "type": "select",
      "required": false,
      "options": ["高", "中", "低"],
      "defaultValue": "中"
    },
    {
      "name": "截止日期",
      "type": "date",
      "required": false
    }
  ],
  "features": ["categories", "tags", "filter"],
  "confidence": 0.88
}
```

**示例3: Calculator (计算器)**
```json
{
  "type": "calculator",
  "name": "BMI计算器",
  "description": "根据身高体重计算BMI指数",
  "fields": [
    {
      "name": "身高(cm)",
      "type": "number",
      "required": true,
      "validation": {
        "min": 50,
        "max": 250
      }
    },
    {
      "name": "体重(kg)",
      "type": "number",
      "required": true,
      "validation": {
        "min": 20,
        "max": 300
      }
    }
  ],
  "features": ["history", "formula"],
  "confidence": 0.92
}
```

### 2.2 App (生成的应用)

App 是核心实体，存储生成的应用信息。

#### 2.2.1 TypeScript 接口

```typescript
interface App {
  id: string;                    // UUID
  userId?: string;               // 用户ID (可选)
  prompt: string;                // 原始需求
  intent: Intent;                // 解析后的意图
  template: string;              // 使用的模板名称
  code: string;                  // 生成的完整代码
  vercelUrl: string;             // Vercel部署URL
  vercelProjectId?: string;      // Vercel项目ID
  status: AppStatus;             // 应用状态
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  deployTime?: number;           // 部署耗时(秒)
  error?: string;                // 错误信息
  metadata?: AppMetadata;        // 元数据
}

type AppStatus = 
  | 'generating'   // 生成中
  | 'deploying'    // 部署中
  | 'ready'        // 已就绪
  | 'failed'       // 失败
  | 'expired';     // 已过期

interface AppMetadata {
  userAgent?: string;            // 用户浏览器信息
  ip?: string;                   // 用户IP
  referer?: string;              // 来源页面
  size?: number;                 // 代码大小(bytes)
  dependencies?: string[];       // 依赖列表
}
```

#### 2.2.2 数据库表设计

```sql
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  intent JSONB NOT NULL,
  template VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  vercel_url VARCHAR(255),
  vercel_project_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'generating' CHECK (
    status IN ('generating', 'deploying', 'ready', 'failed', 'expired')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deploy_time INTEGER,
  error TEXT,
  metadata JSONB,
  
  -- 索引
  CONSTRAINT valid_prompt CHECK (LENGTH(prompt) >= 1 AND LENGTH(prompt) <= 500)
);

-- 创建索引
CREATE INDEX idx_apps_user_id ON apps(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_created_at ON apps(created_at DESC);
CREATE INDEX idx_apps_template ON apps(template);

-- 创建GIN索引用于JSONB查询
CREATE INDEX idx_apps_intent_type ON apps USING GIN ((intent->'type'));
CREATE INDEX idx_apps_intent ON apps USING GIN (intent);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2.3 字段说明

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `id` | UUID | 是 | 主键，自动生成 |
| `user_id` | UUID | 否 | 外键，关联用户表 |
| `prompt` | TEXT | 是 | 用户原始需求（1-500字符） |
| `intent` | JSONB | 是 | NLU解析结果（Intent对象） |
| `template` | VARCHAR(50) | 是 | 模板名称（tracker/todo等） |
| `code` | TEXT | 是 | 生成的完整代码 |
| `vercel_url` | VARCHAR(255) | 否 | Vercel部署URL |
| `vercel_project_id` | VARCHAR(100) | 否 | Vercel项目ID |
| `status` | VARCHAR(20) | 是 | 应用状态（默认generating） |
| `created_at` | TIMESTAMP | 是 | 创建时间 |
| `updated_at` | TIMESTAMP | 是 | 更新时间（自动更新） |
| `deploy_time` | INTEGER | 否 | 部署耗时（秒） |
| `error` | TEXT | 否 | 错误信息 |
| `metadata` | JSONB | 否 | 元数据 |

#### 2.2.4 状态转换

```
generating (生成中)
    ├─ 成功 → deploying (部署中)
    │           ├─ 成功 → ready (已就绪)
    │           └─ 失败 → failed (失败)
    └─ 失败 → failed (失败)

ready (已就绪)
    └─ 30天后 → expired (已过期)
```

### 2.3 User (用户) - 未来功能

用户表用于个性化功能和历史记录。

#### 2.3.1 TypeScript 接口

```typescript
interface User {
  id: string;                    // UUID
  email?: string;                // 邮箱
  name?: string;                 // 昵称
  avatar?: string;               // 头像URL
  createdAt: Date;               // 注册时间
  updatedAt: Date;               // 更新时间
  preferences?: UserPreferences; // 用户偏好
  usage?: UserUsage;             // 使用统计
}

interface UserPreferences {
  defaultTemplate?: string;      // 默认模板
  theme?: 'light' | 'dark';      // 主题
  language?: string;             // 语言
}

interface UserUsage {
  totalApps: number;             // 总生成数
  monthlyApps: number;           // 本月生成数
  lastActiveAt: Date;            // 最后活跃时间
}
```

#### 2.3.2 数据库表设计（未来）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(100),
  avatar VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  usage JSONB DEFAULT '{}',
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
```

### 2.4 Template (模板) - 未来功能

模板表存储可用的代码模板。

#### 2.4.1 TypeScript 接口

```typescript
interface Template {
  id: string;                    // 模板ID
  name: string;                  // 模板名称
  type: string;                  // 模板类型
  description: string;           // 描述
  code: string;                  // 模板代码
  fields: Field[];               // 必需字段
  features: string[];            // 可选功能
  isDefault: boolean;            // 是否默认模板
  isActive: boolean;             // 是否启用
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2.4.2 数据库表设计（未来）

```sql
CREATE TABLE templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认模板
INSERT INTO templates (id, name, type, description, code, fields, features, is_default) VALUES
('tracker', '数据追踪', 'tracker', '追踪任何数据（体重、开支、习惯等）', '...', '[...]', '["chart","export"]', true),
('todo', '待办清单', 'todo', '任务管理', '...', '[...]', '["categories","tags"]', true),
('calculator', '计算器', 'calculator', '各种计算（BMI、汇率等）', '...', '[...]', '["history","formula"]', true),
('countdown', '倒计时', 'countdown', '倒计时（生日、纪念日）', '...', '[...]', '["reminder","share"]', true),
('notes', '笔记', 'notes', '快速记录', '...', '[...]', '["markdown","search"]', true);
```

## 3. 辅助数据模型

### 3.1 GenerateRequest (生成请求)

```typescript
interface GenerateRequest {
  prompt: string;
  userId?: string;
  options?: GenerateOptions;
}

interface GenerateOptions {
  template?: string;
  features?: string[];
  theme?: 'light' | 'dark';
  language?: string;
}
```

### 3.2 GenerateResponse (生成响应)

```typescript
interface GenerateResponse {
  success: boolean;
  data?: GenerateData;
  error?: ErrorInfo;
}

interface GenerateData {
  appId: string;
  url: string;
  code: string;
  intent: Intent;
  template: string;
  deployTime: number;
}

interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}
```

### 3.3 HealthStatus (健康状态)

```typescript
interface HealthStatus {
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

## 4. 数据验证规则

### 4.1 Prompt 验证

```typescript
function validatePrompt(prompt: string): ValidationResult {
  const errors: string[] = [];
  
  // 必填检查
  if (!prompt || prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }
  
  // 长度检查
  if (prompt.length > 500) {
    errors.push('Prompt must be less than 500 characters');
  }
  
  // 内容检查（可选）
  if (prompt.length < 5) {
    errors.push('Prompt is too short, please provide more details');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 4.2 Intent 验证

```typescript
function validateIntent(intent: Intent): ValidationResult {
  const errors: string[] = [];
  
  // 类型检查
  const validTypes = ['tracker', 'todo', 'calculator', 'countdown', 'notes'];
  if (!validTypes.includes(intent.type)) {
    errors.push(`Invalid intent type: ${intent.type}`);
  }
  
  // 名称检查
  if (!intent.name || intent.name.trim().length === 0) {
    errors.push('Intent name is required');
  }
  
  if (intent.name.length > 100) {
    errors.push('Intent name must be less than 100 characters');
  }
  
  // 字段检查
  if (intent.fields) {
    intent.fields.forEach((field, index) => {
      if (!field.name || field.name.trim().length === 0) {
        errors.push(`Field ${index + 1}: name is required`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 4.3 Field 验证

```typescript
function validateField(field: Field): ValidationResult {
  const errors: string[] = [];
  
  // 名称检查
  if (!field.name || field.name.trim().length === 0) {
    errors.push('Field name is required');
  }
  
  // 类型检查
  const validTypes = ['text', 'number', 'date', 'select', 'textarea'];
  if (!validTypes.includes(field.type)) {
    errors.push(`Invalid field type: ${field.type}`);
  }
  
  // select类型必须有options
  if (field.type === 'select' && (!field.options || field.options.length === 0)) {
    errors.push('Select field must have options');
  }
  
  // 验证规则检查
  if (field.validation) {
    if (field.validation.min !== undefined && field.validation.max !== undefined) {
      if (field.validation.min > field.validation.max) {
        errors.push('Min cannot be greater than max');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## 5. 数据迁移策略

### 5.1 初始迁移

```sql
-- 001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE apps (
  -- ... (如上定义)
);

-- 创建初始索引
-- ... (如上定义)

-- 插入测试数据（开发环境）
INSERT INTO apps (prompt, intent, template, code, vercel_url, status) VALUES
('追踪每天喝水量', '{"type":"tracker","name":"喝水量追踪"}', 'tracker', '// code...', 'https://test.vercel.app', 'ready');
```

### 5.2 版本升级策略

```sql
-- 002_add_user_support.sql (未来)
CREATE TABLE users (
  -- ... (如上定义)
);

ALTER TABLE apps ADD COLUMN user_id UUID REFERENCES users(id);

CREATE INDEX idx_apps_user_id ON apps(user_id);
```

## 6. 查询优化

### 6.1 常用查询

#### 获取用户最近的APP
```sql
SELECT id, prompt, vercel_url, status, created_at
FROM apps
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

#### 统计APP类型分布
```sql
SELECT intent->>'type' as type, COUNT(*) as count
FROM apps
WHERE status = 'ready'
GROUP BY intent->>'type'
ORDER BY count DESC;
```

#### 查找失败的APP
```sql
SELECT id, prompt, error, created_at
FROM apps
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 6.2 性能优化建议

1. **使用索引** - 为常用查询字段创建索引
2. **避免SELECT *** - 只查询需要的字段
3. **使用分页** - LIMIT + OFFSET
4. **定期清理** - 删除过期的APP记录
5. **JSONB查询优化** - 使用GIN索引

## 7. 数据安全

### 7.1 敏感数据处理

- **不存储敏感信息** - 不存储密码、token等
- **IP匿名化** - 只存储IP前3段
- **日志脱敏** - 日志中不包含用户输入

### 7.2 访问控制

```sql
-- Row Level Security (RLS)
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的APP
CREATE POLICY "Users can view their own apps"
  ON apps FOR SELECT
  USING (user_id = auth.uid());

-- 匿名用户不能访问任何APP
CREATE POLICY "Anonymous users cannot access apps"
  ON apps FOR ALL
  USING (false);
```

## 8. 已知限制与未来扩展

### 8.1 Code字段存储限制

#### 当前方案（MVP）
- **类型**: `TEXT`
- **限制**: PostgreSQL TEXT类型理论上无限制，但受以下约束：
  - 单行数据最大 ~1GB（包括所有字段）
  - 查询性能可能受影响（大文本查询慢）
  - 内存占用较高

#### 未来扩展方案

**方案1: S3对象存储（推荐）**
```sql
-- 修改表结构
ALTER TABLE apps 
  ADD COLUMN code_storage_type VARCHAR(20) DEFAULT 'database',
  ADD COLUMN code_s3_key VARCHAR(255);

-- code字段改为存储S3路径
-- 实际代码存储在S3: s3://factoria-apps/{app_id}/code.txt
```

**实现逻辑**:
```typescript
// 生成时
if (code.length > 100000) {  // > 100KB
  const s3Key = await uploadToS3(code, `apps/${appId}/code.txt`);
  await saveApp({
    code: s3Key,
    codeStorageType: 's3',
    codeS3Key: s3Key
  });
} else {
  await saveApp({
    code: code,
    codeStorageType: 'database'
  });
}

// 读取时
async function getAppCode(app: App): Promise<string> {
  if (app.codeStorageType === 's3') {
    return await downloadFromS3(app.codeS3Key);
  } else {
    return app.code;
  }
}
```

**方案2: Supabase Storage**
```sql
-- 使用Supabase内置存储
ALTER TABLE apps 
  ADD COLUMN code_file_path VARCHAR(255);

-- 存储在: supabase-storage://factoria-apps/{app_id}/code.txt
```

**方案3: 压缩存储**
```typescript
// 使用gzip压缩
import { gzip, ungzip } from 'node-gzip';

const compressed = await gzip(code);
await saveApp({ code: compressed.toString('base64') });

const decompressed = await ungzip(Buffer.from(app.code, 'base64'));
```

#### 迁移策略
1. **Phase 1 (MVP)**: TEXT存储，监控大小
2. **Phase 2**: 添加S3支持，新数据自动切换
3. **Phase 3**: 迁移旧数据到S3

### 8.2 其他已知限制

| 限制 | 当前方案 | 未来方案 |
|------|---------|---------|
| **单表数据量** | 无限制（Supabase自动扩展） | 分表分库 |
| **JSONB大小** | 无明确限制 | 大型Intent迁移到独立表 |
| **并发写入** | 乐观锁 | 悲观锁 + 队列 |
| **查询性能** | 索引优化 | Redis缓存 |

## 9. 数据备份策略

### 9.1 备份频率

- **每日备份** - 完整数据库备份
- **实时备份** - WAL日志备份
- **保留期限** - 30天

### 9.2 恢复策略

1. **PITR (Point-in-Time Recovery)** - 恢复到任意时间点
2. **快照恢复** - 从每日快照恢复
3. **跨区域备份** - 异地灾备

---

**下一步**: 详细设计模板系统 → [04-TEMPLATES.md](./04-TEMPLATES.md)
