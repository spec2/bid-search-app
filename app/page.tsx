"use client";

import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import Pagination from './components/Pagination';

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
  company: string;
  ministry: string;
  startDate: string;
  endDate: string;
}

export default function Home() {
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSearch, setCurrentSearch] = useState<SearchParams | null>(null);

  const limit = 50;
  const totalPages = Math.ceil(totalCount / limit);

  const executeSearch = async (params: SearchParams, page: number) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setCurrentPage(page);
    
    try {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.append('q', params.query);
      if (params.company) searchParams.append('company', params.company);
      if (params.ministry) searchParams.append('ministry', params.ministry);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      searchParams.append('page', page.toString());

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setResults(data.results);
      setTotalCount(data.totalCount);
    } catch (e) {
      setError('検索結果の取得に失敗しました。');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (params: SearchParams) => {
    // Check if all search parameters are empty
    const isSearchEmpty = Object.values(params).every(value => value === '');
    
    if (isSearchEmpty) {
      setResults([]);
      setTotalCount(0);
      setSearched(true); // Set to true to show "no results" message
      setCurrentSearch(params);
      setCurrentPage(1);
      return;
    }

    setCurrentSearch(params);
    executeSearch(params, 1);
  };

  const handlePageChange = (page: number) => {
    if (currentSearch) {
      executeSearch(currentSearch, page);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto p-4 sm:p-8">
        <section className="text-center py-16 md:py-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-12">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mb-4">
              その入札情報、ここで見つかります。
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              入札サーチ.jpは、国や地方公共団体など、全国の官公庁から公開される膨大な入札・落札情報を集約した無料のデータベースです。
              手間のかかる情報収集は、もう必要ありません。あなたのビジネスを加速させる、価値ある情報を効率的に見つけ出すお手伝いをします。
            </p>
          </div>
        </section>

        <div className="space-y-8">
          <SearchForm onSearch={handleNewSearch} loading={loading} />

          {error && <p className="text-center text-destructive mb-4">{error}</p>}
          
          <ResultsTable results={results} loading={loading} searched={searched} />
          
          {searched && results.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
