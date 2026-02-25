#!/bin/bash

# Factoria Quick Start Script

echo "🚀 Factoria - 一句话APP工厂"
echo "=============================="
echo ""

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install web dependencies
echo "📦 Installing web dependencies..."
cd web && npm install && cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Configure environment variables:"
echo "     cp .env.example .env"
echo "     # Edit .env with your API keys"
echo ""
echo "  2. Start development server:"
echo "     npm run dev"
echo ""
echo "  3. Open http://localhost:5173 in your browser"
echo ""
echo "📝 Documentation:"
echo "  - README.md: Project overview"
echo "  - ROADMAP.md: Development roadmap"
echo ""
