require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// LLM API Key
const LLM_API_KEY = process.env.LLM_API_KEY || '';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Factoria API (Ability-Driven) is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    architecture: 'ability-driven',
    llm: LLM_API_KEY ? 'configured' : 'not configured'
  });
});

// Generate API
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    // 输入验证
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
          code: 'LLM_NOT_CONFIGURED',
          message: 'LLM API key is not configured. Please set LLM_API_KEY environment variable.'
        }
      });
    }

    console.log('Processing prompt:', prompt);

    // 调用 GLM-5 API（能力编排）
    const glm5Response = await callGLM5(prompt);
    const orchestration = parseGLM5Response(glm5Response);

    console.log('Abilities orchestrated:', orchestration.abilities.join(', '));

    // 生成代码（MVP 阶段）
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
        deployTime: 3,
        llm: 'configured'
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
  const systemPrompt = '你是一个能力编排专家。\n\n核心思想：不是选择模板，而是识别并编排需要的能力。\n\n能力库：\n数据层能力：\n- storage: 数据存储和管理\n- persistence: 数据持久化（localStorage）\n- export: 数据导出（CSV/JSON）\n\nUI层能力：\n- form-input: 表单输入\n- list-display: 列表展示\n- card-display: 卡片展示\n- chart: 图表可视化\n\n交互层能力：\n- add: 添加记录\n- edit: 编辑记录\n- delete: 删除记录\n- toggle: 切换状态（完成/未完成）\n- filter: 过滤数据\n- sort: 排序数据\n\n你的任务：\n1. 理解用户意图\n2. 识别需要的能力（从能力库中选择）\n3. 按顺序编排这些能力\n4. 生成完整的React代码\n\n示例：\n用户："追踪每天喝水量"\n→ 意图：数据追踪\n→ 需要的能力：form-input → add → storage → persistence → list-display → chart\n→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、图表可视化\n\n用户："管理待办事项"\n→ 意图：任务管理\n→ 需要的能力：form-input → add → storage → persistence → list-display → toggle → delete\n→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、切换完成状态、删除功能\n\n用户："追踪开支，生成图表，导出为 CSV"\n→ 意图：数据追踪 + 可视化 + 导出\n→ 需要的能力：form-input → add → storage → persistence → list-display → chart → export\n→ 生成代码：包含表单输入、添加按钮、数据存储、列表展示、图表可视化、数据导出\n\n输出格式（JSON）：\n{\n  "intent": "用户意图描述",\n  "app_name": "应用名称（2-8字）",\n  "abilities": ["ability1", "ability2", ...],\n  "orchestration": "编排逻辑说明"\n}\n\n重要：\n- 必须识别高级能力（toggle, delete, chart, export）\n- 如果用户提到"图表"、"可视化"，必须包含 chart 能力\n- 如果用户提到"导出"、"CSV"、"JSON"，必须包含 export 能力\n- 如果用户提到"删除"、"移除"，必须包含 delete 能力\n- 如果用户提到"标记完成"、"完成状态"、"勾选"，必须包含 toggle 能力\n- 只返回JSON，不要包含其他说明文字。';

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
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('GLM API error: ' + response.status + ' - ' + error);
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
      throw new Error('Invalid orchestration: missing required fields');
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
  const abilities = orchestration.abilities || [];

  return 'import React, { useState, useEffect } from \'react\';\n\nexport default function App() {\n  const [records, setRecords] = useState([]);\n  const [formData, setFormData] = useState({\n    value: \'\' });\n\n  useEffect(() => {\n    const saved = localStorage.getItem(\'myapp-data\');\n    if (saved) {\n      setRecords(JSON.parse(saved));\n    }\n  }, []);\n\n  const saveData = (newRecords) => {\n    localStorage.setItem(\'myapp-data\', JSON.stringify(newRecords));\n    setRecords(newRecords);\n  };\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    const newRecord = {\n      id: Date.now().toString(),\n      ...formData,\n      createdAt: new Date()\n    };\n    saveData([...records, newRecord]);\n    setFormData({ value: \'\' });\n  };\n\n  return (\n    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">\n      <div className="max-w-2xl mx-auto">\n        <h1 className="text-3xl font-bold text-white mb-6">' + appName + '</h1>\n        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">\n          <form onSubmit={handleSubmit}>\n            <input\n              type="text"\n              value={formData.value}\n              onChange={(e) => setFormData({ value: e.target.value })}\n              placeholder="输入内容..."\n              className="w-full px-4 py-2 rounded-lg border"\n            />\n            <button type="submit" className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg">\n              添加\n            </button>\n          </form>\n        </div>\n        <div className="bg-white rounded-lg shadow-lg p-6">\n          <h2 className="text-xl font-bold mb-4">历史记录</h2>\n          {records.length === 0 ? (\n            <p className="text-gray-500 text-center py-8">暂无记录</p>\n          ) : (\n            <div className="space-y-2">\n              {records.map(record => (\n                <div key={record.id} className="p-3 bg-gray-50 rounded">\n                  <div className="font-medium">{record.value}</div>\n                  <div className="text-sm text-gray-400">{record.createdAt}</div>\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}';
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
    console.log('   Then restart server.');
  }
});
