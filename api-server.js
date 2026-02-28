import express from 'express';
import cors from 'cors';

// 使用 tsx 动态导入 TypeScript 文件
async function loadHandlers() {
  const generateModule = await import('./api/generate-real.ts');
  const healthModule = await import('./api/health.ts');
  return {
    generate: generateModule.default,
    health: healthModule.default
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Start server with async handler loading
loadHandlers().then(({ generate, health }) => {
  // Routes
  app.use('/api/health', health);
  app.use('/api/generate', generate);

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
    console.log(`🚀 Factoria API (Ability-Driven) running at http://localhost:${PORT}`);
    console.log(`📝 Health: http://localhost:${PORT}/api/health`);
    console.log(`⚡ Generate: POST http://localhost:${PORT}/api/generate`);
  });
}).catch(err => {
  console.error('Failed to load handlers:', err);
  process.exit(1);
});
