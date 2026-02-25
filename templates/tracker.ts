// App Template: Data Tracker
// Use case: Track any data over time (weight, expenses, habits, etc.)

import React, { useState, useEffect } from 'react';

interface TrackerConfig {
  name: string;
  unit?: string;
  fields: string[];
  color?: string;
}

export const trackerTemplate = (config: TrackerConfig) => `
import React, { useState, useEffect } from 'react';

export default function ${config.name.replace(/\s+/g, '')}Tracker() {
  const [data, setData] = useState([]);
  const [input, setInput] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const entry = {
      ...input,
      timestamp: new Date().toISOString()
    };
    setData([...data, entry]);
    localStorage.setItem('${config.name}', JSON.stringify([...data, entry]));
  };

  useEffect(() => {
    const saved = localStorage.getItem('${config.name}');
    if (saved) setData(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">${config.name}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 mb-8">
          ${config.fields.map(f => `
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">${f}</label>
            <input
              type="text"
              onChange={(e) => setInput({...input, ${f}: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>`).join('')}
          <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
            Add Entry
          </button>
        </form>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">History</h2>
          <div className="space-y-2">
            {data.map((entry, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded">
                {Object.entries(entry).map(([k, v]) => (
                  <span key={k} className="mr-4">{k}: {String(v)}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
