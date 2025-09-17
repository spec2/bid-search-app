"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import Pagination from './components/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { ResultsTableSkeleton } from './components/ResultsTableSkeleton';

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

function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true for initial fetch
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 50;
  const totalPages = Math.ceil(totalCount / limit);

  const currentSearch: SearchParams = {
    query: searchParams.get('query') || '',
    company: searchParams.get('company') || '',
    ministry: searchParams.get('ministry') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  };

  useEffect(() => {
    const executeSearch = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (currentSearch.query) params.append('q', currentSearch.query);
        if (currentSearch.company) params.append('company', currentSearch.company);
        if (currentSearch.ministry) params.append('ministry', currentSearch.ministry);
        if (currentSearch.startDate) params.append('startDate', currentSearch.startDate);
        if (currentSearch.endDate) params.append('endDate', currentSearch.endDate);
        params.append('page', page.toString());

        const response = await fetch(`/api/search?${params.toString()}`);
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

    executeSearch();
  }, [searchParams]); // Re-run search whenever URL params change

  const handleSearch = (params: SearchParams) => {
    const newParams = new URLSearchParams();
    if (params.query) newParams.set('query', params.query);
    if (params.company) newParams.set('company', params.company);
    if (params.ministry) newParams.set('ministry', params.ministry);
    if (params.startDate) newParams.set('startDate', params.startDate);
    if (params.endDate) newParams.set('endDate', params.endDate);
    newParams.set('page', '1'); // Reset to first page on new search
    
    router.push(`/?${newParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', newPage.toString());
    router.push(`/?${newParams.toString()}`);
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
            </p>
          </div>
        </section>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>検索条件</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchForm onSearch={handleSearch} loading={loading} initialState={currentSearch} />
            </CardContent>
          </Card>

          {error && <p className="text-center text-destructive mb-4">{error}</p>}
          
          <Card>
            <CardHeader>
              <CardTitle>検索結果</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ResultsTableSkeleton />
              ) : (
                <ResultsTable results={results} loading={loading} searched={true} />
              )}
              
              {!loading && results.length > 0 && (
                <div className="mt-6">
                  <Pagination 
                    currentPage={page}
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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}