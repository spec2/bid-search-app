"use client";

import { useState } from 'react';

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
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setResults(data);
    } catch (e) {
      setError('Failed to fetch results. Please try again.');
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
        <p className="text-gray-600">調達案件名または会社名で検索</p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="例: 航空タービン燃料油"
          className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {loading ? '検索中...' : '検索'}
        </button>
      </div>

      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">調達案件名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事業者名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">落札決定日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">落札価格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">府省</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入札方式</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">読み込み中...</td>
              </tr>
            ) : results.length > 0 ? (
              results.map((bid, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{bid.調達案件名称}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.落札決定日}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatPrice(bid.落札価格)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.ministry_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.bid_method_name}</td>
                </tr>
              ))
            ) : searched && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">検索結果が見つかりませんでした。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}