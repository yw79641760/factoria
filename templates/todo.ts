// App Template: Todo List
// Use case: Task management with categories

export const todoTemplate = (config: { name: string; categories?: string[] }) => `
import React, { useState, useEffect } from 'react';

export default function ${config.name.replace(/\s+/g, '')}Todo() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('${config.categories?.[0] || 'general'}');

  const addTodo = () => {
    if (!input.trim()) return;
    const newTodo = {
      id: Date.now(),
      text: input,
      category,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTodos([...todos, newTodo]);
    setInput('');
    localStorage.setItem('${config.name}_todos', JSON.stringify([...todos, newTodo]));
  };

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? {...t, completed: !t.completed} : t);
    setTodos(updated);
    localStorage.setItem('${config.name}_todos', JSON.stringify(updated));
  };

  useEffect(() => {
    const saved = localStorage.getItem('${config.name}_todos');
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-teal-500 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">${config.name}</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a task..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              ${(config.categories || ['general']).map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <button onClick={addTodo} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className={\`p-4 rounded cursor-pointer \${todo.completed ? 'bg-gray-100 line-through' : 'bg-blue-50'}\`}
              >
                <span className="font-medium">{todo.text}</span>
                <span className="ml-2 text-sm text-gray-500">[{todo.category}]</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
