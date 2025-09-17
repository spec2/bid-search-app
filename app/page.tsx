"use client";

import { Suspense } from 'react';
import { Download } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import Pagination from './components/Pagination';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { ResultsTableSkeleton } from './components/ResultsTableSkeleton';
import { useBidSearch } from '@/lib/hooks/useBidSearch';
import { exportToCsv } from '@/lib/utils';
import { format } from 'date-fns';

function SearchPageClient() {
  const {
    results,
    loading,
    error,
    page,
    totalPages,
    currentSearch,
    handleSearch,
    handlePageChange,
  } = useBidSearch();

  const handleExport = () => {
    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    exportToCsv(results, `search_results_${timestamp}.csv`);
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
              入札サーチ.jpは、国や地方公共団体など、全国の官公庁から公開される膨大な入札・落札情報を集約した無料のデータベースです。手間のかかる情報収集は、もう必要ありません。あなたのビジネスを加速させる、価値ある情報を効率的に見つけ出すお手伝いをします。
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>検索結果</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport} 
                disabled={loading || results.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                CSVエクスポート
              </Button>
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
    <Suspense fallback={<ResultsTableSkeleton />}>
      <SearchPageClient />
    </Suspense>
  );
}