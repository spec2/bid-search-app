"use client";

import { useState, useEffect } from 'react';

// Define the structure of the search results
interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  company_name: string;
  ministry_name: string;
  bid_method_name: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [ministry, setMinistry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ministries, setMinistries] = useState<string[]>([]);
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

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

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (ministry) params.append('ministry', ministry);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setResults(data);
    } catch (e) {
      setError('検索結果の取得に失敗しました。');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  }

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">落札情報検索</h1>
        <p className="text-gray-600">キーワード、府省、期間で検索</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
          >
            <option value="">すべての府省</option>
            {ministries.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">調達案件名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事業者名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">落札決定日</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">落札価格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">府省</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入札方式</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">検索中...</td>
              </tr>
            ) : results.length > 0 ? (
              results.map((bid, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-800">{bid.調達案件名称}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.落札決定日}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatPrice(bid.落札価格)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.ministry_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.bid_method_name}</td>
                </tr>
              ))
            ) : searched && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">検索結果が見つかりませんでした。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}