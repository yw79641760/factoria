import dotenv from 'dotenv';
dotenv.config({ path: 'configs/.env' });

// 测试清理函数
import { cleanGeneratedCode } from './api/lib/vercel-deploy.js';

// 测试清理函数
import { cleanGeneratedCode } from './api/lib/vercel-deploy.js';

const testCode = `import React from 'react';

function HelloWorld() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Hello World
          </h1>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HelloWorld />);`;

console.log('=== Original Code ===');
console.log(testCode);

console.log('\n=== Cleaned Code ===');
const cleaned = cleanGeneratedCode(testCode);
console.log(cleaned);

console.log('\n=== Analysis ===');
console.log('ReactDOM.createRoot removed:', !cleaned.includes('ReactDOM.createRoot'));
console.log('import React removed:', !cleaned.includes('import React'));
console.log('Code length:', cleaned.length);
