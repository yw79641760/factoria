# Factoria 模板系统设计

## 文档信息
- **版本**: 1.0
- **创建日期**: 2026-02-25
- **维护者**: Factoria Team
- **状态**: 🚧 设计中

## 1. 模板系统概述

### 1.1 设计理念

Factoria 的模板系统采用 **"骨架+参数填充"** 模式：

1. **骨架代码** - 预先编写好的React组件框架
2. **参数填充** - 根据Intent动态填充配置
3. **代码组装** - 将多个模块组装成完整应用

### 1.2 核心优势

- **快速生成** - 模板已优化，无需从零编写
- **质量保证** - 模板经过测试，代码质量高
- **易于维护** - 修改模板即可更新所有生成的APP
- **可扩展** - 支持自定义模板

### 1.3 模板分类

```
模板系统
├── 基础模板（5种）
│   ├── Tracker   - 数据追踪
│   ├── Todo      - 待办清单
│   ├── Calculator - 计算器
│   ├── Countdown - 倒计时
│   └── Notes     - 笔记
├── 功能模块（可插拔）
│   ├── Chart     - 图表
│   ├── Export    - 导出
│   ├── Search    - 搜索
│   └── Share     - 分享
└── 自定义模板（未来）
    └── 用户上传模板
```

## 2. 基础模板设计

### 2.1 Tracker (数据追踪)

#### 2.1.1 适用场景
- 体重/身高追踪
- 开支记录
- 习惯养成
- 饮水量记录
- 睡眠时间追踪

#### 2.1.2 核心功能

**P0 (必须)**:
- 数据输入表单
- 历史记录列表
- 数据持久化（localStorage）
- 基础统计（平均值、总计）

**P1 (优先)**:
- 趋势图表
- CSV导出
- 数据搜索
- 日期范围过滤

**P2 (未来)**:
- 多数据集
- 对比分析
- 提醒功能
- 分享功能

#### 2.1.3 代码结构

```typescript
// generated-app/src/App.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DataRecord {
  id: string;
  date: string;
  [fieldName: string]: any;  // 动态字段
  createdAt: Date;
}

export default function App() {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    // 动态字段
  });

  // 从localStorage加载数据
  useEffect(() => {
    const saved = localStorage.getItem('{{appName}}-data');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  // 保存数据到localStorage
  const saveData = (newRecords: DataRecord[]) => {
    localStorage.setItem('{{appName}}-data', JSON.stringify(newRecords));
    setRecords(newRecords);
  };

  // 添加记录
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: DataRecord = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date()
    };
    saveData([...records, newRecord]);
    // 重置表单
  };

  // 删除记录
  const handleDelete = (id: string) => {
    saveData(records.filter(r => r.id !== id));
  };

  // 导出CSV
  const exportCSV = () => {
    const headers = ['日期', /* 动态字段名 */];
    const csv = [
      headers.join(','),
      ...records.map(r => [r.date, /* 动态字段值 */].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `{{appName}}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">{{appName}}</h1>
        
        {/* 输入表单 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit}>
            {/* 动态表单字段 */}
            <button type="submit" className="btn-primary">
              添加记录
            </button>
          </form>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">总记录</div>
            <div className="text-2xl font-bold">{records.length}</div>
          </div>
          {/* 动态统计 */}
        </div>

        {/* 图表（可选） */}
        {records.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <LineChart data={records}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="{{mainField}}" stroke="#8B5CF6" />
            </LineChart>
          </div>
        )}

        {/* 历史记录 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">历史记录</h2>
            <button onClick={exportCSV} className="btn-secondary">
              导出CSV
            </button>
          </div>
          
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无记录</p>
          ) : (
            <div className="space-y-2">
              {records.map(record => (
                <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{record.date}</div>
                    {/* 动态字段显示 */}
                  </div>
                  <button 
                    onClick={() => handleDelete(record.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 2.1.4 配置参数

```typescript
interface TrackerTemplateConfig {
  appName: string;
  fields: Field[];
  features: {
    chart: boolean;       // 是否显示图表
    export: boolean;      // 是否支持导出
    search: boolean;      // 是否支持搜索
    filter: boolean;      // 是否支持过滤
  };
  theme: {
    primaryColor: string;
    gradient: string;
  };
}
```

### 2.2 Todo (待办清单)

#### 2.2.1 适用场景
- 任务管理
- 购物清单
- 学习计划
- 项目任务

#### 2.2.2 核心功能

**P0 (必须)**:
- 添加任务
- 标记完成
- 删除任务
- 任务持久化

**P1 (优先)**:
- 分类标签
- 优先级设置
- 截止日期
- 过滤排序

**P2 (未来)**:
- 子任务
- 提醒通知
- 协作共享
- 模板任务

#### 2.2.3 代码结构

```typescript
// generated-app/src/App.tsx
import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  dueDate?: string;
  createdAt: Date;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // 加载任务
  useEffect(() => {
    const saved = localStorage.getItem('{{appName}}-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // 保存任务
  const saveTasks = (newTasks: Task[]) => {
    localStorage.setItem('{{appName}}-tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
  };

  // 添加任务
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      createdAt: new Date()
    };

    saveTasks([...tasks, task]);
    setNewTask('');
  };

  // 切换完成状态
  const toggleTask = (id: string) => {
    saveTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  // 删除任务
  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-teal-500 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">{{appName}}</h1>

        {/* 添加任务表单 */}
        <form onSubmit={addTask} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="添加新任务..."
              className="flex-1 px-4 py-2 rounded-lg"
            />
            <button type="submit" className="btn-primary">
              添加
            </button>
          </div>
        </form>

        {/* 过滤器 */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded ${filter === f ? 'bg-white text-blue-600' : 'text-white'}`}
            >
              {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
            </button>
          ))}
        </div>

        {/* 统计 */}
        <div className="text-white mb-4">
          {completedCount} / {tasks.length} 已完成
        </div>

        {/* 任务列表 */}
        <div className="bg-white rounded-lg shadow-lg">
          {filteredTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {filter === 'all' ? '暂无任务' : '没有符合条件的任务'}
            </p>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 border-b last:border-b-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5"
                />
                <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

### 2.3 Calculator (计算器)

#### 2.3.1 适用场景
- BMI计算
- 汇率转换
- 单位换算
- 贷款计算
- 数学公式

#### 2.3.2 核心功能

**P0 (必须)**:
- 输入表单
- 公式计算
- 结果展示
- 历史记录

**P1 (优先)**:
- 公式说明
- 多单位支持
- 结果复制
- 历史管理

**P2 (未来)**:
- 自定义公式
- 图表展示
- 导出报告

#### 2.3.3 代码结构

```typescript
// generated-app/src/App.tsx
import React, { useState } from 'react';

interface Calculation {
  id: string;
  inputs: Record<string, number>;
  result: number;
  timestamp: Date;
}

export default function App() {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<Calculation[]>([]);

  // 计算逻辑（根据公式动态生成）
  const calculate = () => {
    try {
      // 示例：BMI = 体重 / (身高^2)
      const { height, weight } = inputs as { height: number; weight: number };
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      
      setResult(bmi);
      
      // 保存历史
      const calculation: Calculation = {
        id: Date.now().toString(),
        inputs,
        result: bmi,
        timestamp: new Date()
      };
      setHistory([calculation, ...history]);
    } catch (error) {
      alert('计算错误，请检查输入');
    }
  };

  // 获取BMI分类
  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 24) return '正常';
    if (bmi < 28) return '偏胖';
    return '肥胖';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">{{appName}}</h1>

        {/* 输入表单 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                身高 (cm)
              </label>
              <input
                type="number"
                value={inputs.height || ''}
                onChange={(e) => setInputs({ ...inputs, height: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="例如: 175"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                体重 (kg)
              </label>
              <input
                type="number"
                value={inputs.weight || ''}
                onChange={(e) => setInputs({ ...inputs, weight: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="例如: 70"
              />
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full mt-6 btn-primary"
          >
            计算
          </button>
        </div>

        {/* 结果展示 */}
        {result !== null && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">计算结果</h2>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {result.toFixed(2)}
              </div>
              <div className="text-lg text-gray-600">
                {getBMICategory(result)}
              </div>
            </div>

            {/* 公式说明 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">BMI 计算公式</h3>
              <code className="text-sm">
                BMI = 体重(kg) / 身高²(m²)
              </code>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">历史记录</h2>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="p-3 bg-gray-50 rounded flex justify-between">
                  <span>
                    {h.inputs.height}cm, {h.inputs.weight}kg
                  </span>
                  <span className="font-bold">{h.result.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.4 Countdown (倒计时)

#### 2.4.1 适用场景
- 生日倒计时
- 纪念日
- 考试倒计时
- 项目截止日期
- 节假日倒计时

#### 2.4.2 核心功能

**P0 (必须)**:
- 目标日期设置
- 实时倒计时
- 天/时/分/秒显示
- 多个倒计时

**P1 (优先)**:
- 事件分类
- 提醒通知
- 分享功能
- 重复事件

**P2 (未来)**:
- 倒计时主题
- 历史记录
- 日历集成
- 社交分享

#### 2.4.3 代码结构

```typescript
// generated-app/src/App.tsx
import React, { useState, useEffect } from 'react';

interface Countdown {
  id: string;
  name: string;
  targetDate: string;
  category?: string;
  createdAt: Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function App() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [newCountdown, setNewCountdown] = useState({ name: '', targetDate: '' });
  const [timeRemaining, setTimeRemaining] = useState<Record<string, TimeRemaining>>({});

  // 加载倒计时
  useEffect(() => {
    const saved = localStorage.getItem('{{appName}}-countdowns');
    if (saved) {
      setCountdowns(JSON.parse(saved));
    }
  }, []);

  // 保存倒计时
  const saveCountdowns = (newCountdowns: Countdown[]) => {
    localStorage.setItem('{{appName}}-countdowns', JSON.stringify(newCountdowns));
    setCountdowns(newCountdowns);
  };

  // 更新倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining: Record<string, TimeRemaining> = {};
      
      countdowns.forEach(c => {
        const diff = new Date(c.targetDate).getTime() - Date.now();
        
        if (diff > 0) {
          remaining[c.id] = {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
          };
        }
      });
      
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdowns]);

  // 添加倒计时
  const addCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    
    const countdown: Countdown = {
      id: Date.now().toString(),
      ...newCountdown,
      createdAt: new Date()
    };

    saveCountdowns([...countdowns, countdown]);
    setNewCountdown({ name: '', targetDate: '' });
  };

  // 删除倒计时
  const deleteCountdown = (id: string) => {
    saveCountdowns(countdowns.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 to-orange-500 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">{{appName}}</h1>

        {/* 添加倒计时表单 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={addCountdown}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newCountdown.name}
                onChange={(e) => setNewCountdown({ ...newCountdown, name: e.target.value })}
                placeholder="事件名称"
                className="px-4 py-2 border rounded-lg"
                required
              />
              <input
                type="date"
                value={newCountdown.targetDate}
                onChange={(e) => setNewCountdown({ ...newCountdown, targetDate: e.target.value })}
                className="px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              添加倒计时
            </button>
          </form>
        </div>

        {/* 倒计时列表 */}
        {countdowns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500">暂无倒计时</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countdowns.map(c => {
              const remaining = timeRemaining[c.id];
              
              return (
                <div key={c.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{c.name}</h3>
                    <button
                      onClick={() => deleteCountdown(c.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    目标日期: {new Date(c.targetDate).toLocaleDateString()}
                  </div>

                  {remaining ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-3xl font-bold text-pink-600">{remaining.days}</div>
                        <div className="text-xs text-gray-600">天</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-pink-600">{remaining.hours}</div>
                        <div className="text-xs text-gray-600">时</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-pink-600">{remaining.minutes}</div>
                        <div className="text-xs text-gray-600">分</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-pink-600">{remaining.seconds}</div>
                        <div className="text-xs text-gray-600">秒</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-green-600 font-bold">
                      时间到！
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.5 Notes (笔记)

#### 2.5.1 适用场景
- 快速记录
- 读书笔记
- 会议记录
- 日记
- 知识卡片

#### 2.5.2 核心功能

**P0 (必须)**:
- 创建笔记
- 编辑笔记
- 删除笔记
- 笔记持久化

**P1 (优先)**:
- Markdown支持
- 标签分类
- 搜索功能
- 导出功能

**P2 (未来)**:
- 富文本编辑
- 图片上传
- 协作编辑
- 版本历史

#### 2.5.3 代码结构

```typescript
// generated-app/src/App.tsx
import React, { useState, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 加载笔记
  useEffect(() => {
    const saved = localStorage.getItem('{{appName}}-notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  // 保存笔记
  const saveNotes = (newNotes: Note[]) => {
    localStorage.setItem('{{appName}}-notes', JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  // 创建新笔记
  const createNote = () => {
    const note: Note = {
      id: Date.now().toString(),
      title: '新笔记',
      content: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    saveNotes([note, ...notes]);
    setSelectedNote(note);
  };

  // 更新笔记
  const updateNote = (updatedNote: Note) => {
    const newNotes = notes.map(n => 
      n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date() } : n
    );
    saveNotes(newNotes);
    setSelectedNote(updatedNote);
  };

  // 删除笔记
  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  // 获取所有标签
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  // 过滤笔记
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag === null || note.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-500 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">{{appName}}</h1>
          <button
            onClick={createNote}
            className="btn-primary"
          >
            新建笔记
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* 笔记列表 */}
          <div className="col-span-1 bg-white rounded-lg shadow-lg p-4">
            {/* 搜索框 */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />

            {/* 标签过滤 */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedTag === null ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* 笔记列表 */}
            <div className="space-y-2">
              {filteredNotes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无笔记</p>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3 rounded cursor-pointer ${
                      selectedNote?.id === note.id ? 'bg-indigo-100' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{note.title}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {note.content.substring(0, 50)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 编辑器 */}
          <div className="col-span-2 bg-white rounded-lg shadow-lg p-6">
            {selectedNote ? (
              <div>
                {/* 标题 */}
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateNote({ ...selectedNote, title: e.target.value })}
                  className="w-full text-2xl font-bold border-none outline-none mb-4"
                  placeholder="标题"
                />

                {/* 标签 */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={selectedNote.tags.join(', ')}
                    onChange={(e) => updateNote({ 
                      ...selectedNote, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="标签（用逗号分隔）"
                  />
                </div>

                {/* 内容 */}
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => updateNote({ ...selectedNote, content: e.target.value })}
                  className="w-full h-96 px-4 py-2 border rounded-lg font-mono"
                  placeholder="开始写笔记..."
                />

                {/* 操作按钮 */}
                <div className="flex justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    最后更新: {new Date(selectedNote.updatedAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    删除笔记
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                选择一个笔记或创建新笔记
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 3. 模板填充引擎

### 3.1 填充流程

```
Intent 对象
    ↓
模板选择
    ├─ 根据 type 选择基础模板
    └─ 根据 features 添加功能模块
    ↓
参数填充
    ├─ appName → 替换标题
    ├─ fields → 生成表单字段
    ├─ features → 添加功能模块
    └─ theme → 应用主题样式
    ↓
代码组装
    ├─ 基础组件
    ├─ 功能模块
    └─ 样式代码
    ↓
完整代码
```

### 3.2 填充引擎实现

```typescript
// lib/template-engine.ts

export class TemplateEngine {
  // 加载基础模板
  private loadBaseTemplate(type: string): string {
    const templates = {
      tracker: require('../templates/tracker.ts').default,
      todo: require('../templates/todo.ts').default,
      calculator: require('../templates/calculator.ts').default,
      countdown: require('../templates/countdown.ts').default,
      notes: require('../templates/notes.ts').default
    };
    
    return templates[type] || templates.tracker;
  }

  // 填充模板
  public fill(intent: Intent): string {
    // 1. 加载基础模板
    let code = this.loadBaseTemplate(intent.type);
    
    // 2. 替换基本变量
    code = code.replace(/\{\{appName\}\}/g, intent.name);
    
    // 3. 生成动态字段
    if (intent.fields && intent.fields.length > 0) {
      const formFields = this.generateFormFields(intent.fields);
      code = code.replace(/\{\{formFields\}\}/g, formFields);
      
      const displayFields = this.generateDisplayFields(intent.fields);
      code = code.replace(/\{\{displayFields\}\}/g, displayFields);
    }
    
    // 4. 添加功能模块
    if (intent.features) {
      code = this.addFeatures(code, intent.features);
    }
    
    // 5. 应用主题
    code = this.applyTheme(code, intent);
    
    return code;
  }

  // 生成表单字段
  private generateFormFields(fields: Field[]): string {
    return fields.map(field => {
      switch (field.type) {
        case 'date':
          return `
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ${field.name}
              </label>
              <input
                type="date"
                value={formData.${field.name}}
                onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                ${field.required ? 'required' : ''}
              />
            </div>
          `;
        
        case 'number':
          return `
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ${field.name}
              </label>
              <input
                type="number"
                value={formData.${field.name}}
                onChange={(e) => setFormData({ ...formData, ${field.name}: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                ${field.validation?.min ? `min="${field.validation.min}"` : ''}
                ${field.validation?.max ? `max="${field.validation.max}"` : ''}
              />
            </div>
          `;
        
        case 'select':
          return `
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ${field.name}
              </label>
              <select
                value={formData.${field.name}}
                onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                ${(field.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('\n')}
              </select>
            </div>
          `;
        
        default:
          return `
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ${field.name}
              </label>
              <input
                type="text"
                value={formData.${field.name}}
                onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
              />
            </div>
          `;
      }
    }).join('\n');
  }

  // 添加功能模块
  private addFeatures(code: string, features: string[]): string {
    features.forEach(feature => {
      switch (feature) {
        case 'chart':
          code = this.addChartModule(code);
          break;
        case 'export':
          code = this.addExportModule(code);
          break;
        case 'search':
          code = this.addSearchModule(code);
          break;
        case 'share':
          code = this.addShareModule(code);
          break;
      }
    });
    
    return code;
  }

  // 添加图表模块
  private addChartModule(code: string): string {
    // 添加 recharts 导入
    code = code.replace(
      "import React",
      "import React\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';"
    );
    
    // 添加图表组件
    const chartComponent = `
      {/* 图表 */}
      {records.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">趋势图</h2>
          <LineChart data={records} width={600} height={300}>
            <XAxis dataKey="date" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8B5CF6" />
          </LineChart>
        </div>
      )}
    `;
    
    return code.replace('{/* 图表占位符 */}', chartComponent);
  }
}
```

### 3.3 模板变量规范

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `{{appName}}` | 应用名称 | "喝水量追踪" |
| `{{formFields}}` | 动态表单字段 | 生成的input元素 |
| `{{displayFields}}` | 显示字段 | 列表显示的字段 |
| `{{primaryColor}}` | 主题色 | "#8B5CF6" |
| `{{gradient}}` | 背景渐变 | "from-purple-500 to-pink-500" |

## 4. 模板测试策略

### 4.1 单元测试

```typescript
// __tests__/template-engine.test.ts

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  test('should fill tracker template correctly', () => {
    const intent: Intent = {
      type: 'tracker',
      name: '喝水量追踪',
      fields: [
        { name: '日期', type: 'date', required: true },
        { name: '水量(ml)', type: 'number', required: true }
      ],
      features: ['chart', 'export']
    };

    const code = engine.fill(intent);

    expect(code).toContain('喝水量追踪');
    expect(code).toContain('LineChart');
    expect(code).toContain('exportCSV');
  });

  test('should generate valid form fields', () => {
    const fields: Field[] = [
      { name: '日期', type: 'date', required: true },
      { name: '数量', type: 'number', validation: { min: 0, max: 100 } }
    ];

    const html = engine.generateFormFields(fields);

    expect(html).toContain('type="date"');
    expect(html).toContain('type="number"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="100"');
  });
});
```

### 4.2 集成测试

```typescript
// __tests__/integration/template-generation.test.ts

describe('Template Generation Integration', () => {
  test('should generate working React app', async () => {
    const intent: Intent = {
      type: 'todo',
      name: '任务清单',
      fields: [
        { name: '任务', type: 'text', required: true }
      ]
    };

    const code = engine.fill(intent);
    
    // 编译代码
    const compiled = await compileTypeScript(code);
    
    // 运行测试
    expect(compiled).toBeDefined();
    expect(compiled).not.toContain('SyntaxError');
  });
});
```

## 5. 模板版本管理

### 5.1 版本号规范

- **主版本号**: 不兼容的API变更
- **次版本号**: 功能增加
- **修订号**: Bug修复

示例：`1.2.3`
- 1: 基础模板架构
- 2: 新增2个功能模块
- 3: 修复3个bug

### 5.2 升级策略

```sql
-- 模板版本表
CREATE TABLE template_versions (
  id VARCHAR(50) PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入新版本
INSERT INTO template_versions (id, version, code, changelog) VALUES
('tracker', '1.0.0', '...', '初始版本');
```

---

**下一步**: 详细设计NLU需求解析 → [05-NLU-DESIGN.md](./05-NLU-DESIGN.md)
