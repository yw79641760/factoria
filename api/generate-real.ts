import type { VercelRequest, VercelResponse } from '@vercel/node';
import { glm5Client } from './lib/glm5-client';
import { Database } from './lib/database';

/**
 * POST /api/generate
 * 生成APP的API端点
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }
    });
  }

  try {
    const { prompt, userId, options } = req.body;

    // 1. 输入验证
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Prompt is required' }
      });
    }

    if (prompt.length < 1 || prompt.length > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Prompt must be between 1 and 500 characters' }
      });
    }

    // 2. 创建APP记录（状态：generating）
    const appId = `app_${Date.now()}`;
    const app = await Database.createApp({
      user_id: userId,
      prompt,
      intent: { type: 'tracker', name: 'Generating...' },  // 临时
      template: 'unknown',
      code: '',
      status: 'generating'
    });

    // 3. NLU解析
    console.log(`[${new Date().toISOString()}] Parsing intent for app ${app.id}`);
    const intent = await glm5Client.parseIntent(prompt);
    
    // 4. 更新Intent
    await Database.updateAppStatus(app.id, 'generating', { intent });

    // 5. 选择模板
    const template = intent.type;
    
    // 6. 生成代码（这里先使用简单的模板填充，后续可以调用GLM生成）
    const code = await generateSimpleCode(intent);

    // 7. 更新代码
    await Database.updateAppStatus(app.id, 'deploying', { 
      template,
      code 
    });

    // 8. 模拟部署（MVP阶段，实际部署需要Vercel API）
    const vercelUrl = `https://${app.id}.vercel.app`;
    
    // 9. 更新状态为ready
    await Database.updateAppStatus(app.id, 'ready', {
      vercel_url: vercelUrl,
      deploy_time: 5
    });

    // 10. 返回结果
    return res.status(200).json({
      success: true,
      data: {
        appId: app.id,
        url: vercelUrl,
        code,
        intent,
        template,
        deployTime: 5
      }
    });

  } catch (error: any) {
    console.error('Generate API error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    });
  }
}

/**
 * 简单的代码生成（基于模板）
 * MVP阶段：使用预定义模板
 */
async function generateSimpleCode(intent: any): Promise<string> {
  const { type, name, fields = [], features = [] } = intent;

  // 根据类型生成不同的代码
  switch (type) {
    case 'tracker':
      return generateTrackerCode(name, fields, features);
    case 'todo':
      return generateTodoCode(name, fields, features);
    case 'calculator':
      return generateCalculatorCode(name, fields, features);
    case 'countdown':
      return generateCountdownCode(name, fields, features);
    case 'notes':
      return generateNotesCode(name, fields, features);
    default:
      return generateTrackerCode(name, fields, features);
  }
}

function generateTrackerCode(name: string, fields: any[], features: string[]): string {
  return `
import React, { useState, useEffect } from 'react';

export default function App() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ${fields.map(f => `${f.name}: ''`).join(',\n    ')}
  });

  useEffect(() => {
    const saved = localStorage.getItem('${name}-data');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const saveData = (newRecords: any[]) => {
    localStorage.setItem('${name}-data', JSON.stringify(newRecords));
    setRecords(newRecords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date()
    };
    saveData([...records, newRecord]);
    // Reset form
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">${name}</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit}>
            {/* Form fields will be generated dynamically */}
            <button type="submit" className="btn-primary">
              添加记录
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">历史记录</h2>
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无记录</p>
          ) : (
            <div className="space-y-2">
              {records.map(record => (
                <div key={record.id} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{record.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`.trim();
}

function generateTodoCode(name: string, fields: any[], features: string[]): string {
  return `
import React, { useState, useEffect } from 'react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('${name}-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  const saveTasks = (newTasks: any[]) => {
    localStorage.setItem('${name}-tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      createdAt: new Date()
    };
    
    saveTasks([...tasks, task]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    saveTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-teal-500 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">${name}</h1>
        
        <form onSubmit={addTask} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="添加新任务..."
              className="flex-1 px-4 py-2 rounded-lg"
            />
            <button type="submit" className="btn-primary">添加</button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-lg">
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无任务</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 border-b">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5"
                />
                <span className={task.completed ? 'line-through text-gray-400' : ''}>
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 ml-auto"
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
`.trim();
}

function generateCalculatorCode(name: string, fields: any[], features: string[]): string {
  return `// Calculator code for ${name}`;
}

function generateCountdownCode(name: string, fields: any[], features: string[]): string {
  return `// Countdown code for ${name}`;
}

function generateNotesCode(name: string, fields: any[], features: string[]): string {
  return `// Notes code for ${name}`;
}
