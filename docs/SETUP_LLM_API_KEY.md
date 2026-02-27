# Factoria MVP - LLM_API_KEY 配置

## ⚠️ 需要配置 LLM_API_KEY

### 步骤 1：获取 GLM-5 API Key

1. 访问 https://open.bigmodel.cn/
2. 注册/登录
3. 创建 API Key
4. 复制 API Key

### 步骤 2：配置 .env 文件

运行以下命令：

```bash
cd ~/Dev/code/factoria
cat > .env << 'EOF'
LLM_API_KEY=your_actual_api_key_here
EOF
```

**或者手动编辑**：

```bash
cd ~/Dev/code/factoria
vim .env
```

将以下内容粘贴到 .env 文件中：

```
LLM_API_KEY=your_actual_api_key_here
```

### 步骤 3：验证配置

```bash
cd ~/Dev/code/factoria
cat .env
```

**期望输出**：
```
LLM_API_KEY=re_xxxxxxxxxxxxxx
```

### 步骤 4：重启服务器

```bash
cd ~/Dev/code/factoria
npm run dev
```

---

## 🔍 故障排查

### 问题 1：.env 文件不存在

**原因**：.env 文件未被创建

**解决方案**：
```bash
cd ~/Dev/code/factoria
cat > .env << 'EOF'
LLM_API_KEY=your_actual_api_key_here
EOF
```

### 问题 2：API Key 格式错误

**原因**：API Key 格式不正确

**正确格式**：
- GLM-5: `re_xxxxxxxxxxxxxx`（20 字符）
- 以 `re_` 开头

### 问题 3：权限错误

**原因**：.env 文件权限不正确

**解决方案**：
```bash
chmod 600 .env
```

---

## 🚀 配置完成后

### 测试健康检查

```bash
curl http://localhost:3000/api/health
```

**期望响应**：
```json
{
  "success": true,
  "llm": "configured"
}
```

### 测试生成 API

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"追踪每天喝水量"}'
```

---

**配置好 LLM_API_KEY 后，重启服务器即可测试真实的 LLM 能力编排！** 🚀
