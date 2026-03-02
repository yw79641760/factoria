import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';

// 加载 configs/.env 文件
dotenv.config({ path: path.join(process.cwd(), 'configs', '.env') });

// 使用 tsx 动态导入 TypeScript 文件
async function loadHandlers() {
  const generateModule = await import('./api/generate-real.ts');
  const generateModularModule = await import('./api/generate-modular.ts');
  const healthModule = await import('./api/health.ts');
  const supabaseTestModule = await import('./api/test-supabase.ts');
  return {
    generate: generateModule.default,
    generateModular: generateModularModule.default,
    health: healthModule.default,
    supabaseTest: supabaseTestModule.default
  };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Start server with async handler loading
loadHandlers().then(({ generate, generateModular, health, supabaseTest }) => {
  // Routes
  app.use('/api/health', health);
  app.use('/api/generate', generate);
  app.use('/api/generate-modular', generateModular);
  app.use('/api/test-supabase', supabaseTest);

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
    console.log(`⚡ Generate (Legacy): POST http://localhost:${PORT}/api/generate`);
    console.log(`⚡ Generate (Modular): POST http://localhost:${PORT}/api/generate-modular`);
    console.log(`🗄️  Supabase Test: GET http://localhost:${PORT}/api/test-supabase`);
  });
}).catch(err => {
  console.error('Failed to load handlers:', err);
  process.exit(1);
});
