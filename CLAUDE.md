# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Factoria** - 能力驱动一句话APP工厂 (Ability-driven One-Sentence App Factory)

Core concept: `Agent-Native Software = Framework(Abilities Orchestrated by LLM)`

The system generates customized web apps from natural language prompts by orchestrating reusable abilities via LLM.

## Commands

```bash
# Install dependencies (root + web)
npm install && cd web && npm install && cd ..

# Start development (both web + API)
npm run dev

# Start individually
npm run dev:web     # Frontend: http://localhost:5173
npm run dev:api     # API: http://localhost:3000

# Build
npm run build

# Lint web code
cd web && npm run lint

# Deploy to Vercel
npm run deploy
```

## Environment Variables

Create `configs/.env` (copy from `configs/.env.example`):

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | 智谱 AI API Key (GLM-5) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `VERCEL_ACCESS_TOKEN` | Vercel access token |
| `VERCEL_PROJECT_ID` | Vercel project ID |

## Architecture

Three-layer architecture:

1. **Framework Layer** - React + Vite + Tailwind (presentation)
2. **Orchestration Layer** - LLM orchestrates abilities
3. **Ability Layer** - 11 reusable abilities

### Core Abilities

| Category | Abilities |
|----------|-----------|
| **Data** | storage, persistence, export |
| **UI** | form-input, list-display, card-display, chart |
| **Interaction** | add, edit, delete, toggle, filter, sort |

## Project Structure

```
factoria/
├── web/                    # React frontend (workspace)
│   └── src/               # React components
├── api/                   # Express API server
│   ├── generate.ts        # Code generation logic
│   ├── generate-modular.ts
│   └── lib/               # API utilities
├── docs/                  # Design documentation
├── configs/               # Environment configuration
└── package.json           # Root workspace config
```

## Key Files

- `README.md` - Project overview and quick start
- `docs/01-ARCHITECTURE-v2.md` - Detailed architecture (ability-driven)
- `docs/02-API-DESIGN-v2.md` - API specification
- `LESSONS.md` - Lessons learned from mistakes
