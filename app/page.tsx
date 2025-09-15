"use client";

import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';

// Define the structure of the search results
interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  company_name: string;
  ministry_name: string;
  bid_method_name: string;
}

interface SearchParams {
  query: string;
  ministry: string;
  startDate: string;
  endDate: string;
}

export default function Home() {
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.append('q', params.query);
      if (params.ministry) searchParams.append('ministry', params.ministry);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await fetch(`/api/search?${searchParams.toString()}`);
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto p-4 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            公共調達の透明性を、すべての人に。官公庁 入札・落札情報データベース
          </h1>
          <p className="text-gray-600">
            入札サーチ.jpは、国や地方公共団体が公開する膨大な入札・落札情報を、一つの場所で横断的に検索できる無料のデータベースです。<br />
            面倒な情報収集はもう不要です。キーワード、府省、事業者名、期間を指定するだけで、あなたのビジネスチャンスに繋がる公共調達案件を素早く見つけ出します。
          </p>
        </div>

        <SearchForm onSearch={handleSearch} loading={loading} />

        {error && <p className="text-center text-red-500 mb-4">{error}</p>}

        <ResultsTable results={results} loading={loading} searched={searched} />
      </main>

      <Footer />
    </div>
  );
}