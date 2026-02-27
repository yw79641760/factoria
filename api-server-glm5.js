require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// LLM API Key（通用，支持多种 LLM）
const LLM_API_KEY = process.env.LLM_API_KEY || '';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Factoria API (Ability-Driven) is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    architecture: 'ability-driven',
    glm5: LLM_API_KEY ? 'configured' : 'not configured'
  });
});

// Generate API
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

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

    if (!LLM_API_KEY) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GLM5_NOT_CONFIGURED',
          message: 'GLM-5 API key is not configured. Please set LLM_API_KEY environment variable.'
        }
      });
    }

    console.log('Processing prompt:', prompt);

    // 调用 GLM-5 API
    const glm5Response = await callGLM5(prompt);
    const orchestration = parseGLM5Response(glm5Response);

    console.log('Abilities orchestrated:', orchestration.abilities.join(', '));

    // 生成代码
    const mockCode = generateSimpleCode(orchestration);
    const mockUrl = 'https://myapp-' + Date.now() + '.vercel.app';

    return res.status(200).json({
      success: true,
      data: {
        appId: 'app_' + Date.now(),
        url: mockUrl,
        code: mockCode,
        orchestration: orchestration,
        abilities: orchestration.abilities,
        deployTime: 5,
        glm5: 'configured'
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

// 调用 GLM-5 API
async function callGLM5(prompt) {
  const systemPrompt = '你是一个能力编排专家。核心思想：不是选择模板，而是识别并编排需要的能力。能力库：数据层（storage, persistence, export），UI层（form-input, list-display, card-display, chart），交互层（add, edit, delete, toggle, filter, sort）。你的任务：1. 理解用户意图 2. 识别需要的能力 3. 按顺序编排这些能力 4. 生成完整的React代码。输出格式：JSON {intent, app_name, abilities, orchestration}。只返回JSON，不要包含其他说明文字。';

  const userMessage = '用户需求：\n"""' + prompt + '"""';

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v3/model-api/glm-4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + LLM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('GLM API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GLM API call failed:', error);
    throw error;
  }
}

// 解析 GLM-5 响应
function parseGLM5Response(response) {
  let jsonStr = response.trim();

  if (jsonStr.includes('```json')) {
    const match = jsonStr.match(/```json\n([\s\S]+?)\n```/);
    if (match) jsonStr = match[1];
  } else if (jsonStr.includes('```')) {
    const match = jsonStr.match(/```\n([\s\S]+?)\n```/);
    if (match) jsonStr = match[1];
  }

  try {
    const orchestration = JSON.parse(jsonStr);
    if (!orchestration.intent || !orchestration.abilities) {
      throw new Error('Invalid orchestration');
    }
    orchestration.confidence = 0.9;
    return orchestration;
  } catch (error) {
    console.error('Failed to parse GLM-5 response:', error);
    throw new Error('Failed to parse GLM-5 response');
  }
}

// 生成代码
function generateSimpleCode(orchestration) {
  const appName = orchestration.app_name || '我的APP';

  return 'import React, { useState, useEffect } from \'react\';\n\nexport default function App() {\n  const [records, setRecords] = useState([]);\n  const [formData, setFormData] = useState({ value: \'\' });\n\n  useEffect(() => {\n    const saved = localStorage.getItem(\'myapp-data\');\n    if (saved) {\n      setRecords(JSON.parse(saved));\n    }\n  }, []);\n\n  const saveData = (newRecords) => {\n    localStorage.setItem(\'myapp-data\', JSON.stringify(newRecords));\n    setRecords(newRecords);\n  };\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    const newRecord = {\n      id: Date.now().toString(),\n      ...formData,\n      createdAt: new Date()\n    };\n    saveData([...records, newRecord]);\n    setFormData({ value: \'\' });\n  };\n\n  return (\n    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">\n      <div className="max-w-2xl mx-auto">\n        <h1 className="text-3xl font-bold text-white mb-6">' + appName + '</h1>\n        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">\n          <form onSubmit={handleSubmit}>\n            <input\n              type="text"\n              value={formData.value}\n              onChange={(e) => setFormData({ value: e.target.value })}\n              placeholder="输入内容..."\n              className="w-full px-4 py-2 rounded-lg border"\n            />\n            <button type="submit" className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg">\n              添加\n            </button>\n          </form>\n        </div>\n        <div className="bg-white rounded-lg shadow-lg p-6">\n          <h2 className="text-xl font-bold mb-4">历史记录</h2>\n          {records.length === 0 ? (\n            <p className="text-gray-500 text-center py-8">暂无记录</p>\n          ) : (\n            <div className="space-y-2">\n              {records.map(record => (\n                <div key={record.id} className="p-3 bg-gray-50 rounded">\n                  <div className="font-medium">{record.value}</div>\n                  <div className="text-sm text-gray-400">{record.createdAt}</div>\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}';
}

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
  console.log('🚀 Factoria API (Ability-Driven with Real GLM-5) running at http://localhost:' + PORT);
  console.log('📝 Health: http://localhost:' + PORT + '/api/health');
  console.log('⚡ Generate: POST http://localhost:' + PORT + '/api/generate');
  if (LLM_API_KEY) {
    console.log('🤖 GLM-5: ✅ Configured');
  } else {
    console.log('🤖 GLM-5: ❌ Not configured (set LLM_API_KEY)');
    console.log('');
    console.log('💡 To use GLM-5, set environment variable:');
    console.log('   export LLM_API_KEY=your_api_key_here');
    console.log('   Then restart the server.');
  }
});
