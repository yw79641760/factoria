import { useState } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    url?: string
    code?: string
    error?: string
  } | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          url: data.url,
          code: data.code
        })
      } else {
        setResult({ error: data.error })
      }
    } catch (error) {
      setResult({ error: 'Failed to generate app' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            ✨ Factoria
          </h1>
          <p className="text-2xl text-purple-200">
            说出你的想法，得到你的专属APP
          </p>
        </div>

        {/* Main Input */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="我想要一个追踪每天喝水量的APP..."
              className="w-full h-32 bg-white/20 text-white placeholder-purple-200 rounded-lg p-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </span>
              ) : (
                '🚀 生成APP'
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              {result.error ? (
                <div className="text-red-300">
                  <p className="text-xl font-bold">❌ 生成失败</p>
                  <p className="mt-2">{result.error}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-bold text-green-300 mb-4">✅ APP生成成功！</p>

                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
                    >
                      打开APP →
                    </a>
                  )}

                  {result.code && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-purple-200 hover:text-white">
                        查看代码
                      </summary>
                      <pre className="mt-4 p-4 bg-black/50 rounded-lg overflow-auto text-sm text-green-300">
                        {result.code}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Examples */}
          <div className="mt-12">
            <p className="text-purple-200 text-center mb-4">试试这些：</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                '追踪每天喝水量',
                '倒计时到生日还有多少天',
                '简单的待办清单',
                'BMI计算器',
                '读书笔记记录'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="px-4 py-2 bg-white/10 text-purple-200 rounded-full hover:bg-white/20 transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-purple-200">
          <p>灵感来自 Karpathy 的 "LLM Year in Review 2025"</p>
          <p className="mt-2 text-sm opacity-75">
            Powered by GLM-5 + Vercel + Supabase
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
