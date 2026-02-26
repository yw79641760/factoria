# Factoria 系统架构设计 v2.0

## 文档信息
- **版本**: 2.0（能力驱动架构）
- **创建日期**: 2026-02-26
- **维护者**: Factoria Team
- **状态**: 🎯 设计中

## 核心公式

**Agent-Native Software = Framework(Abilities Orchestrated by LLM)**

```
Factoria 
= Framework (Abilities Orchestrated by GLM-5)
= 框架 (GLM-5编排的能力)
```

---

## 1. 架构概述

### 1.1 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Framework                        │
│                      呈现层（Shell）                          │
│  ├─ Web (React + Vite + Tailwind)                           │
│  ├─ PWA (Progressive Web App)                               │
│  └─ Mobile (未来：iOS / Android)                            │
│  职责：需求实现的最终呈现                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ 调用
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Layer 2: Orchestrated by LLM                    │
│                   业务逻辑层（编排）                           │
│  ├─ 数据挖掘的业务逻辑                                        │
│  ├─ PRD定义的业务逻辑                                         │
│  └─ 人工描述的业务逻辑                                        │
│  职责：将小需求实现进行有机整合                                │
└────────────────────┬────────────────────────────────────────┘
                     │ 编排
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: Abilities                        │
│                   能力层（Agent Skills）                       │
│  ├─ 确定性能力（符号主义）                                    │
│  │   └─ math, string, array, date, format                   │
│  ├─ 非确定性能力（连接主义）                                  │
│  │   └─ vision, nlp, recommendation                         │
│  └─ API能力                                                 │
│      └─ http, storage, geolocation                          │
│  职责：将需求拆解成小需求，能力复用，系统复杂性控制              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 架构特点

**从模板驱动 → 能力驱动**

| 维度 | v1.0（模板驱动） | v2.0（能力驱动） |
|------|----------------|-----------------|
| **核心思路** | 预定义模板 | 能力组合 |
| **扩展方式** | 需要新模板 | 沉淀新能力 |
| **LLM角色** | 填充变量 | 编排能力 |
| **适用场景** | 固定场景 | 不确定性场景 |
| **哲学** | 符号主义 | 符号主义 + 连接主义 |

---

## 2. Layer 1: Framework（呈现层）

### 2.1 职责

- 提供统一的用户界面
- 管理应用生命周期
- 处理用户输入输出
- 不关心业务逻辑，只负责呈现

### 2.2 技术栈

```
Framework Stack
├─ 核心：React 18 + TypeScript
├─ 构建：Vite 7
├─ 样式：Tailwind CSS 4
├─ 部署：Vercel (Web/PWA)
└─ 未来：React Native (Mobile)
```

### 2.3 框架设计

```typescript
// @factoria/core - Framework层

import React from 'react';

/**
 * APP框架定义
 */
export class Framework {
  /**
   * 定义一个应用
   */
  static define<TInputs, TOutput>(config: {
    // 应用元信息
    name: string;
    description?: string;
    version?: string;
    
    // 输入定义
    inputs: InputField[];
    
    // 计算逻辑（由LLM生成）
    compute: (inputs: TInputs, abilities: Abilities) => Promise<TOutput> | TOutput;
    
    // 展示逻辑（由LLM生成）
    display: (output: TOutput) => React.ReactNode;
    
    // 主题配置（可选）
    theme?: ThemeConfig;
  }) {
    // 返回一个React组件
    return function GeneratedApp() {
      const [inputs, setInputs] = useState<Partial<TInputs>>({});
      const [output, setOutput] = useState<TOutput | null>(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<Error | null>(null);
      
      // 获取能力
      const abilities = useAbilities();
      
      // 处理提交
      const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const result = await config.compute(inputs as TInputs, abilities);
          setOutput(result);
        } catch (err) {
          setError(err as Error);
        } finally {
          setLoading(false);
        }
      };
      
      // 渲染
      return (
        <div className="app-framework">
          <Header name={config.name} description={config.description} />
          
          <InputForm 
            fields={config.inputs}
            values={inputs}
            onChange={setInputs}
          />
          
          <SubmitButton onClick={handleSubmit} loading={loading} />
          
          {error && <ErrorDisplay error={error} />}
          
          {output && (
            <OutputDisplay>
              {config.display(output)}
            </OutputDisplay>
          )}
        </div>
      );
    };
  }
}

/**
 * 输入字段定义
 */
interface InputField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  label?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];  // for select
  validation?: ValidationRule;
}

/**
 * 主题配置
 */
interface ThemeConfig {
  primaryColor?: string;
  gradient?: string;
  dark?: boolean;
}
```

### 2.4 框架示例

**Web框架**（当前）：
```typescript
// PWA框架
import { Framework } from '@factoria/core';

const BMIApp = Framework.define({
  name: 'BMI计算器',
  inputs: [
    { name: '身高', type: 'number', label: '身高(cm)', required: true },
    { name: '体重', type: 'number', label: '体重(kg)', required: true }
  ],
  
  compute: (inputs, abilities) => {
    const { math, format } = abilities;
    const bmi = math.divide(inputs.体重, math.pow(inputs.身高 / 100, 2));
    return { bmi: format.number(bmi, 2) };
  },
  
  display: (output) => (
    <div className="text-center">
      <div className="text-5xl font-bold">{output.bmi}</div>
    </div>
  )
});
```

**Mobile框架**（未来）：
```typescript
// React Native框架
import { Framework } from '@factoria/mobile';

const BMIApp = Framework.define({
  // 相同的配置，不同的呈现
  name: 'BMI计算器',
  inputs: [...],
  compute: (inputs, abilities) => { /* 相同逻辑 */ },
  display: (output) => (
    <View style={styles.container}>
      <Text style={styles.result}>{output.bmi}</Text>
    </View>
  )
});
```

---

## 3. Layer 2: Orchestrated by LLM（业务逻辑层）

### 3.1 职责

- 理解用户需求
- 识别需要的能力
- 生成编排逻辑
- 有机整合为完整应用

### 3.2 业务逻辑来源

```
Orchestration Sources
├─ 人工描述（当前）
│   └─ 用户的自然语言需求
│       例如："做一个BMI计算器"
│
├─ PRD定义（未来）
│   └─ 产品需求文档解析
│       例如：从Notion/飞书文档提取需求
│
└─ 数据挖掘（未来）
    └─ 从历史数据发现模式
        例如：分析用户行为，推荐常用能力组合
```

### 3.3 LLM编排流程

```
用户需求（"做一个BMI计算器"）
    ↓
【Step 1: 需求理解】
    ├─ 提取关键信息：BMI、计算器
    ├─ 识别领域：健康/医疗
    └─ 理解目标：计算身体质量指数
    ↓
【Step 2: 能力识别】
    需要哪些能力？
    ├─ 输入能力：UI表单
    ├─ 数学能力：除法、乘方
    ├─ 格式化能力：数字格式化
    └─ 展示能力：结果渲染
    ↓
【Step 3: 编排生成】
    生成代码：
    ```typescript
    Framework.define({
      name: 'BMI计算器',
      inputs: [
        { name: '身高', type: 'number', unit: 'cm' },
        { name: '体重', type: 'number', unit: 'kg' }
      ],
      compute: (inputs, { math, format }) => {
        const height = math.divide(inputs.身高, 100);
        const bmi = math.divide(inputs.体重, math.pow(height, 2));
        return { bmi: format.number(bmi, 2) };
      },
      display: (result) => <div>{result.bmi}</div>
    })
    ```
    ↓
【Step 4: 有机整合】
    在框架中运行，形成完整应用
```

### 3.4 GLM-5 Prompt设计

```typescript
// api/lib/orchestrator.ts

export class Orchestrator {
  /**
   * 生成编排代码
   */
  async orchestrate(userNeed: string): Promise<OrchestrationResult> {
    const systemPrompt = `
你是一个应用编排专家。根据用户需求，生成能力编排代码。

可用能力：
- math: 数学能力（add, subtract, multiply, divide, pow, sqrt）
- format: 格式化能力（number, currency, date）
- http: HTTP能力（get, post）
- storage: 存储能力（get, set, remove）
- device: 设备能力（geolocation, camera）

框架API：
Framework.define({
  name: string,
  inputs: InputField[],
  compute: (inputs, abilities) => output,
  display: (output) => ReactNode
})

要求：
1. 识别需要的能力
2. 生成完整的编排代码
3. 代码应该简洁、高效
4. 使用TypeScript语法
    `;

    const response = await this.glm5.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `用户需求：${userNeed}` }
    ]);

    // 解析生成的代码
    const code = this.extractCode(response);
    
    return {
      code,
      abilities: this.extractAbilities(code),
      inputs: this.extractInputs(code)
    };
  }
}
```

---

## 4. Layer 3: Abilities（能力层）

### 4.1 职责

- 提供原子化的、可复用的能力
- 将需求拆解成小需求
- 控制系统复杂性

### 4.2 能力分类

```typescript
// @factoria/abilities - 能力库

/**
 * 能力类型
 */
type AbilityType = 
  | 'pure'        // 纯函数，确定性
  | 'ai'          // AI能力，有限非确定性
  | 'api'         // API能力，需要网络
  | 'device';     // 设备能力，需要硬件

/**
 * 能力定义
 */
interface Ability {
  name: string;
  type: AbilityType;
  description: string;
  functions: Record<string, Function>;
  metadata?: {
    accuracy?: number;  // AI能力的准确率
    latency?: number;   // 平均延迟
  };
}
```

### 4.3 确定性能力（符号主义）

```typescript
/**
 * 数学能力（确定性）
 */
export const mathAbility: Ability = {
  name: 'math',
  type: 'pure',
  description: '数学计算能力',
  functions: {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
    divide: (a: number, b: number) => {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    },
    pow: (base: number, exponent: number) => Math.pow(base, exponent),
    sqrt: (num: number) => Math.sqrt(num),
    abs: (num: number) => Math.abs(num),
    round: (num: number, decimals: number = 0) => {
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    }
  }
};

/**
 * 字符串能力（确定性）
 */
export const stringAbility: Ability = {
  name: 'string',
  type: 'pure',
  description: '字符串处理能力',
  functions: {
    split: (str: string, separator: string) => str.split(separator),
    join: (arr: string[], separator: string) => arr.join(separator),
    trim: (str: string) => str.trim(),
    toUpperCase: (str: string) => str.toUpperCase(),
    toLowerCase: (str: string) => str.toLowerCase(),
    replace: (str: string, search: string, replace: string) => 
      str.replace(new RegExp(search, 'g'), replace),
    format: (template: string, ...args: any[]) => 
      template.replace(/{}/g, () => args.shift())
  }
};

/**
 * 格式化能力（确定性）
 */
export const formatAbility: Ability = {
  name: 'format',
  type: 'pure',
  description: '数据格式化能力',
  functions: {
    number: (num: number, decimals: number = 2) => num.toFixed(decimals),
    currency: (amount: number, currency: string = 'CNY') => 
      new Intl.NumberFormat('zh-CN', { 
        style: 'currency', 
        currency 
      }).format(amount),
    date: (date: Date | string, format: string = 'YYYY-MM-DD') => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day);
    },
    percentage: (num: number, decimals: number = 2) => 
      `${(num * 100).toFixed(decimals)}%`
  }
};

/**
 * 数组能力（确定性）
 */
export const arrayAbility: Ability = {
  name: 'array',
  type: 'pure',
  description: '数组处理能力',
  functions: {
    map: <T, U>(arr: T[], fn: (item: T) => U) => arr.map(fn),
    filter: <T>(arr: T[], fn: (item: T) => boolean) => arr.filter(fn),
    reduce: <T, U>(arr: T[], fn: (acc: U, item: T) => U, initial: U) => 
      arr.reduce(fn, initial),
    sort: <T>(arr: T[], fn?: (a: T, b: T) => number) => 
      [...arr].sort(fn),
    unique: <T>(arr: T[]) => [...new Set(arr)],
    flatten: <T>(arr: T[][]) => arr.flat()
  }
};
```

### 4.4 非确定性能力（连接主义）

```typescript
/**
 * 视觉能力（有限非确定性）
 */
export const visionAbility: Ability = {
  name: 'vision',
  type: 'ai',
  description: '图像识别能力',
  metadata: {
    accuracy: 0.95,  // 95%准确率
    latency: 500     // 平均500ms
  },
  functions: {
    classify: async (image: Blob): Promise<string> => {
      // 调用图像分类API
      const result = await callVisionAPI('classify', image);
      return result.label;
    },
    
    detect: async (image: Blob): Promise<Detection[]> => {
      // 调用目标检测API
      const result = await callVisionAPI('detect', image);
      return result.objects;
    },
    
    ocr: async (image: Blob): Promise<string> => {
      // 调用OCR API
      const result = await callVisionAPI('ocr', image);
      return result.text;
    }
  }
};

/**
 * NLP能力（有限非确定性）
 */
export const nlpAbility: Ability = {
  name: 'nlp',
  type: 'ai',
  description: '自然语言处理能力',
  metadata: {
    accuracy: 0.92,
    latency: 300
  },
  functions: {
    sentiment: async (text: string): Promise<SentimentResult> => {
      // 情感分析
      const result = await callNLPAPI('sentiment', text);
      return {
        score: result.score,
        label: result.label
      };
    },
    
    extract: async (text: string, type: string): Promise<string[]> => {
      // 实体抽取
      const result = await callNLPAPI('extract', { text, type });
      return result.entities;
    },
    
    summarize: async (text: string, maxLength: number): Promise<string> => {
      // 文本摘要
      const result = await callNLPAPI('summarize', { text, maxLength });
      return result.summary;
    }
  }
};
```

### 4.5 API能力

```typescript
/**
 * HTTP能力
 */
export const httpAbility: Ability = {
  name: 'http',
  type: 'api',
  description: 'HTTP请求能力',
  functions: {
    get: async (url: string, options?: RequestOptions) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: options?.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    post: async (url: string, data: any, options?: RequestOptions) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  }
};

/**
 * 存储能力
 */
export const storageAbility: Ability = {
  name: 'storage',
  type: 'api',
  description: '本地存储能力',
  functions: {
    get: (key: string) => {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    
    set: (key: string, value: any) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    
    remove: (key: string) => {
      localStorage.removeItem(key);
    },
    
    clear: () => {
      localStorage.clear();
    }
  }
};

/**
 * 地理位置能力
 */
export const geolocationAbility: Ability = {
  name: 'geolocation',
  type: 'device',
  description: '地理位置能力',
  functions: {
    getCurrentPosition: (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
    },
    
    watchPosition: (callback: (position: GeolocationPosition) => void) => {
      return navigator.geolocation.watchPosition(callback);
    },
    
    clearWatch: (watchId: number) => {
      navigator.geolocation.clearWatch(watchId);
    }
  }
};
```

### 4.6 能力注册与使用

```typescript
// @factoria/abilities

/**
 * 能力注册表
 */
class AbilityRegistry {
  private abilities = new Map<string, Ability>();
  
  /**
   * 注册能力
   */
  register(ability: Ability) {
    this.abilities.set(ability.name, ability);
  }
  
  /**
   * 获取能力
   */
  get(name: string): Ability | undefined {
    return this.abilities.get(name);
  }
  
  /**
   * 获取所有能力
   */
  getAll(): Ability[] {
    return Array.from(this.abilities.values());
  }
  
  /**
   * 按类型获取能力
   */
  getByType(type: AbilityType): Ability[] {
    return this.getAll().filter(a => a.type === type);
  }
}

// 全局注册表
const registry = new AbilityRegistry();

// 注册基础能力
registry.register(mathAbility);
registry.register(stringAbility);
registry.register(formatAbility);
registry.register(arrayAbility);
registry.register(httpAbility);
registry.register(storageAbility);
registry.register(geolocationAbility);

// 未来注册AI能力
// registry.register(visionAbility);
// registry.register(nlpAbility);

/**
 * 使用能力的Hook
 */
export function useAbilities(): Record<string, any> {
  const abilities: Record<string, any> = {};
  
  registry.getAll().forEach(ability => {
    abilities[ability.name] = ability.functions;
  });
  
  return abilities;
}

/**
 * 获取特定能力
 */
export function useAbility<T = any>(name: string): T {
  const ability = registry.get(name);
  if (!ability) {
    throw new Error(`Ability not found: ${name}`);
  }
  return ability.functions as T;
}
```

---

## 5. 完整示例

### 5.1 BMI计算器

**用户需求**："做一个BMI计算器"

**LLM编排**：
```typescript
import { Framework } from '@factoria/core';
import { math, format } from '@factoria/abilities';

export default Framework.define({
  name: 'BMI计算器',
  description: '计算身体质量指数',
  
  inputs: [
    {
      name: '身高',
      type: 'number',
      label: '身高(cm)',
      placeholder: '请输入身高',
      required: true,
      validation: { min: 50, max: 250 }
    },
    {
      name: '体重',
      type: 'number',
      label: '体重(kg)',
      placeholder: '请输入体重',
      required: true,
      validation: { min: 20, max: 300 }
    }
  ],
  
  compute: (inputs, abilities) => {
    const { math, format } = abilities;
    
    // 使用数学能力
    const heightInMeters = math.divide(inputs.身高, 100);
    const bmi = math.divide(inputs.体重, math.pow(heightInMeters, 2));
    
    // 分类逻辑
    const category = 
      bmi < 18.5 ? '偏瘦' :
      bmi < 24 ? '正常' :
      bmi < 28 ? '偏胖' : '肥胖';
    
    return {
      bmi: format.number(bmi, 2),
      category
    };
  },
  
  display: (result) => (
    <div className="text-center py-8">
      <div className="text-6xl font-bold text-purple-600 mb-4">
        {result.bmi}
      </div>
      <div className="text-2xl text-gray-600">
        {result.category}
      </div>
    </div>
  )
});
```

### 5.2 汇率转换器

**用户需求**："做一个汇率转换器"

**LLM编排**：
```typescript
import { Framework } from '@factoria/core';
import { http, math, format } from '@factoria/abilities';

export default Framework.define({
  name: '汇率转换器',
  description: '实时汇率转换',
  
  inputs: [
    {
      name: '金额',
      type: 'number',
      label: '金额',
      required: true
    },
    {
      name: '源货币',
      type: 'select',
      options: ['CNY', 'USD', 'EUR', 'JPY', 'GBP'],
      defaultValue: 'CNY'
    },
    {
      name: '目标货币',
      type: 'select',
      options: ['CNY', 'USD', 'EUR', 'JPY', 'GBP'],
      defaultValue: 'USD'
    }
  ],
  
  compute: async (inputs, abilities) => {
    const { http, math, format } = abilities;
    
    // 使用HTTP能力获取汇率
    const rateData = await http.get(
      `https://api.exchangerate.com/latest?base=${inputs.源货币}`
    );
    
    const rate = rateData.rates[inputs.目标货币];
    
    // 使用数学能力计算
    const result = math.multiply(inputs.金额, rate);
    
    // 使用格式化能力
    return {
      amount: format.currency(result, inputs.目标货币),
      rate: format.number(rate, 4)
    };
  },
  
  display: (result) => (
    <div className="text-center py-8">
      <div className="text-5xl font-bold text-green-600 mb-4">
        {result.amount}
      </div>
      <div className="text-sm text-gray-500">
        汇率: {result.rate}
      </div>
    </div>
  )
});
```

### 5.3 喝水量追踪（带存储）

**用户需求**："追踪每天喝水量"

**LLM编排**：
```typescript
import { Framework } from '@factoria/core';
import { storage, format, math } from '@factoria/abilities';

export default Framework.define({
  name: '喝水量追踪',
  description: '记录每天喝水情况',
  
  inputs: [
    {
      name: '日期',
      type: 'date',
      defaultValue: 'today'
    },
    {
      name: '水量',
      type: 'number',
      label: '水量(ml)',
      required: true,
      validation: { min: 0, max: 10000 }
    }
  ],
  
  compute: (inputs, abilities) => {
    const { storage, format, math } = abilities;
    
    // 使用存储能力获取历史记录
    const records = storage.get('water-records') || [];
    
    // 添加新记录
    const newRecord = {
      date: inputs.日期,
      amount: inputs.水量,
      timestamp: Date.now()
    };
    
    records.push(newRecord);
    
    // 使用存储能力保存
    storage.set('water-records', records);
    
    // 使用数学能力计算统计
    const todayRecords = records.filter(r => r.date === inputs.日期);
    const total = math.reduce(
      todayRecords.map(r => r.amount),
      (sum, amount) => math.add(sum, amount),
      0
    );
    
    return {
      today: format.number(total, 0),
      records: todayRecords
    };
  },
  
  display: (result) => (
    <div>
      <div className="text-center py-8">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {result.today} ml
        </div>
        <div className="text-gray-500">今日饮水量</div>
      </div>
      
      <div className="bg-white rounded-lg p-4">
        <h3 className="font-bold mb-2">今日记录</h3>
        {result.records.map((r, i) => (
          <div key={i} className="py-2 border-b">
            {r.amount} ml
          </div>
        ))}
      </div>
    </div>
  )
});
```

---

## 6. 部署架构

```
用户输入需求
    ↓
【Web UI】
React App (Vercel)
    ↓
【API Layer】
/api/orchestrate (Serverless)
    ↓
【LLM Layer】
GLM-5 API
├─ 理解需求
├─ 识别能力
└─ 生成编排代码
    ↓
【Runtime Layer】
Vercel Edge Functions
├─ 执行编排代码
├─ 调用能力库
└─ 返回结果
    ↓
【Storage Layer】
Supabase
├─ 存储应用记录
└─ 缓存能力数据
    ↓
返回给用户
```

---

## 7. 技术栈总结

### 7.1 Framework层
- React 18 + TypeScript
- Vite 7
- Tailwind CSS 4
- Vercel (部署)

### 7.2 Abilities层
- @factoria/abilities (能力库)
- @factoria/core (框架核心)
- Supabase (存储)
- 外部API (汇率、天气等)

### 7.3 Orchestration层
- GLM-5 API (编排生成)
- Vercel Edge Functions (运行时)
- TypeScript Compiler (代码执行)

---

## 8. 未来扩展

### 8.1 能力扩展
- 更多确定性能力（加密、压缩、解析）
- 更多AI能力（图像、语音、视频）
- 更多设备能力（相机、麦克风、传感器）
- 更多服务端能力（认证、支付、通知）

### 8.2 框架扩展
- PWA支持（离线使用）
- Mobile支持（React Native）
- Desktop支持（Electron）

### 8.3 编排扩展
- 从PRD文档自动生成
- 从数据挖掘自动发现
- 从用户行为学习优化

---

**架构版本**: 2.0
**核心创新**: 从模板驱动 → 能力驱动
**公式**: Agent-Native Software = Framework(Abilities Orchestrated by LLM)
