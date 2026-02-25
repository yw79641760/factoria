const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Factoria API Mock is running',
    timestamp: new Date().toISOString()
  });
});

// Generate app (mock)
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required'
    });
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock response
  const appId = `app_${Date.now()}`;
  const mockCode = `// Generated App: ${prompt}
import React from 'react';

export default function GeneratedApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-4">✨ ${prompt}</h1>
      <p className="text-white">This is your custom app!</p>
      <p className="text-purple-200 mt-4 text-sm">App ID: ${appId}</p>
    </div>
  );
}`;

  res.json({
    success: true,
    appId,
    url: `https://${appId}.vercel.app`,
    code: mockCode
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Factoria API Mock running at http://localhost:${PORT}`);
  console.log(`📝 Health: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Generate: POST http://localhost:${PORT}/api/generate`);
});
