import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';

// 使用 createRequire 来支持 TypeScript 文件
const require = createRequire(import.meta.url);

const PORT = process.env.PORT || 3000;

// 创建 Express 应用
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Factoria API (Ability-Driven) is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    architecture: 'ability-driven'
  });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    // 简单验证
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

    // 最小MVP：返回模拟的能力编排结果
    console.log(`[${new Date().toISOString()}] Processing prompt: "${prompt}"`);

    // 模拟 GLM-5 能力编排
    const mockOrchestration = {
      intent: `处理需求：${prompt}`,
      app_name: '我的APP',
      abilities: ['form-input', 'add', 'storage', 'persistence', 'list-display'],
      orchestration: '表单输入 → 添加记录 → 数据存储 → 数据持久化 → 列表展示',
      confidence: 0.9
    };

    // 模拟代码生成（简单的 React 代码）
    const mockCode = `import React, { useState, useEffect } from 'react';

export default function App() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    value: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('myapp-data');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const saveData = (newRecords) => {
    localStorage.setItem('myapp-data', JSON.stringify(newRecords));
    setRecords(newRecords);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date()
    };
    saveData([...records, newRecord]);
    setFormData({ value: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">我的APP</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ value: e.target.value })}
              placeholder="输入内容..."
              className="w-full px-4 py-2 rounded-lg border"
            />
            <button type="submit" className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg">
              添加
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
                  <div className="font-medium">{record.value}</div>
                  <div className="text-sm text-gray-400">{record.createdAt}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

    // 模拟部署（MVP阶段）
    const mockUrl = `https://myapp-${Date.now()}.vercel.app`;
    const deployTime = 3;

    console.log(`[${new Date().toISOString()}] Generated mock app`);

    return res.status(200).json({
      success: true,
      data: {
        appId: `app_${Date.now()}`,
        url: mockUrl,
        code: mockCode,
        orchestration: mockOrchestration,
        abilities: mockOrchestration.abilities,
        deployTime
      }
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Factoria API (Ability-Driven MVP) running at http://localhost:${PORT}`);
  console.log(`📝 Health: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Generate: POST http://localhost:${PORT}/api/generate`);
  console.log(`💡 Note: MVP mode uses mock GLM-5 orchestration`);
});
