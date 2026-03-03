import dotenv from 'dotenv';
dotenv.config({ path: 'configs/.env' });

const apiKey = process.env.LLM_API_KEY;
if (!apiKey) {
  console.error('LLM_API_KEY not found in environment');
  process.exit(1);
}

import { GLM5Client } from './api/lib/glm5-client.js';

const client = new GLM5Client(apiKey);

const systemPrompt = `Generate a simple React counter component.

Requirements:
1. Do NOT use TypeScript
2. Do NOT use import statements
3. Start with: const { useState } = React;
4. Include both increment and decrement buttons
5. Display the current count

Return only the code, no markdown formatting.`;

async function test() {
  const response = await client.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Create a counter' }
  ], { temperature: 0.7, maxTokens: 1000 });

  console.log('Generated code:');
  console.log(response);
}

test().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
