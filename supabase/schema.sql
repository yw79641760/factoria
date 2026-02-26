-- Factoria 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行

-- ============================================
-- 1. 启用必要的扩展
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 创建 apps 表
-- ============================================

CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
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
  
  -- 约束
  CONSTRAINT valid_prompt CHECK (LENGTH(prompt) >= 1 AND LENGTH(prompt) <= 500)
);

-- 添加注释
COMMENT ON TABLE apps IS '生成的APP记录';
COMMENT ON COLUMN apps.id IS 'APP唯一ID';
COMMENT ON COLUMN apps.user_id IS '用户ID（未来）';
COMMENT ON COLUMN apps.prompt IS '用户原始需求（1-500字符）';
COMMENT ON COLUMN apps.intent IS 'NLU解析结果（JSONB）';
COMMENT ON COLUMN apps.template IS '使用的模板名称';
COMMENT ON COLUMN apps.code IS '生成的完整代码';
COMMENT ON COLUMN apps.vercel_url IS 'Vercel部署URL';
COMMENT ON COLUMN apps.status IS 'APP状态';
COMMENT ON COLUMN apps.deploy_time IS '部署耗时（秒）';

-- ============================================
-- 3. 创建索引
-- ============================================

-- 用户查询索引
CREATE INDEX IF NOT EXISTS idx_apps_user_id ON apps(user_id) WHERE user_id IS NOT NULL;

-- 状态过滤索引
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);

-- 时间排序索引
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON apps(created_at DESC);

-- 模板索引
CREATE INDEX IF NOT EXISTS idx_apps_template ON apps(template);

-- JSONB查询索引
CREATE INDEX IF NOT EXISTS idx_apps_intent_type ON apps USING GIN ((intent->'type'));
CREATE INDEX IF NOT EXISTS idx_apps_intent ON apps USING GIN (intent);

-- ============================================
-- 4. 创建更新时间触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apps_updated_at 
  BEFORE UPDATE ON apps
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 配置 Row Level Security (RLS)
-- ============================================

-- 启用RLS
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- MVP阶段：允许所有读取
CREATE POLICY "Allow all read access"
  ON apps FOR SELECT
  USING (true);

-- MVP阶段：允许所有插入
CREATE POLICY "Allow all insert access"
  ON apps FOR INSERT
  WITH CHECK (true);

-- MVP阶段：允许所有更新
CREATE POLICY "Allow all update access"
  ON apps FOR UPDATE
  USING (true);

-- ============================================
-- 6. 插入测试数据（可选）
-- ============================================

-- 插入一个示例APP
INSERT INTO apps (prompt, intent, template, code, vercel_url, status)
VALUES 
  (
    '追踪每天喝水量',
    '{"type":"tracker","name":"喝水量追踪","fields":[{"name":"日期","type":"date","required":true},{"name":"水量(ml)","type":"number","required":true}],"features":["chart","export"],"confidence":0.95}',
    'tracker',
    '// Generated code...',
    'https://test-app.vercel.app',
    'ready'
  );

-- ============================================
-- 7. 创建视图（可选，用于统计分析）
-- ============================================

-- APP统计视图
CREATE OR REPLACE VIEW app_stats AS
SELECT 
  COUNT(*) as total_apps,
  COUNT(*) FILTER (WHERE status = 'ready') as ready_apps,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_apps,
  AVG(deploy_time) FILTER (WHERE status = 'ready') as avg_deploy_time,
  intent->>'type' as app_type
FROM apps
GROUP BY intent->>'type';

-- ============================================
-- 8. 验证表创建
-- ============================================

-- 查看表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'apps'
ORDER BY ordinal_position;

-- 查看索引
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'apps';

-- 查看已创建的策略
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'apps';
