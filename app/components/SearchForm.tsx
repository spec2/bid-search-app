"use client";

import { useState, useEffect } from 'react';

interface SearchFormProps {
  onSearch: (params: { query: string; ministry: string; startDate: string; endDate: string; }) => void;
  loading: boolean;
}

const SearchForm = ({ onSearch, loading }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [ministry, setMinistry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ministries, setMinistries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const response = await fetch('/api/ministries');
        if (!response.ok) {
          throw new Error('Failed to fetch ministries');
        }
        const data = await response.json();
        setMinistries(data);
      } catch (e) {
        console.error(e);
        setError('府省一覧の取得に失敗しました。');
      }
    };
    fetchMinistries();
  }, []);

  const handleSearchClick = () => {
    onSearch({ query, ministry, startDate, endDate });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワード (例: 燃料油)"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={ministry}
          onChange={(e) => setMinistry(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-placeholder={!ministry}
        >
          <option value="">すべての府省</option>
          {ministries.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-placeholder={!startDate}
          aria-label="開始日"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-placeholder={!endDate}
          aria-label="終了日"
        />
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleSearchClick}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {loading ? '検索中...' : '検索'}
        </button>
      </div>
    </div>
  );
};

export default SearchForm;
