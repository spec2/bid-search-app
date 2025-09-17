"use client";

import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import Pagination from './components/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

// Define the structure of the search results
interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  法人番号: { 商号又は名称: string } | null;
  府省コード: { 名称: string } | null;
  入札方式コード: { 名称: string } | null;
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
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <section className="text-center py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground mb-4">
              その入札情報、ここで見つかります。
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              入札サーチ.jpは、国や地方公共団体など、全国の官公庁から公開される膨大な入札・落札情報を集約した無料のデータベースです。
              手間のかかる情報収集は、もう必要ありません。あなたのビジネスを加速させる、価値ある情報を効率的に見つけ出すお手伝いをします。
            </p>
          </div>
        </section>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>検索条件</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchForm onSearch={handleNewSearch} loading={loading} />
            </CardContent>
          </Card>

          {error && <p className="text-center text-destructive mb-4">{error}</p>}
          
          <Card>
            <CardHeader>
              <CardTitle>検索結果</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTable results={results} loading={loading} searched={searched} />
              
              {searched && results.length > 0 && (
                <div className="mt-6">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}