"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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

export function useBidSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
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

  const executeSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams(searchParams.toString());
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
  }, [searchParams]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSearch = (params: SearchParams) => {
    const newParams = new URLSearchParams();
    if (params.query) newParams.set('query', params.query);
    if (params.company) newParams.set('company', params.company);
    if (params.ministry) newParams.set('ministry', params.ministry);
    if (params.startDate) newParams.set('startDate', params.startDate);
    if (params.endDate) newParams.set('endDate', params.endDate);
    newParams.set('page', '1');
    
    router.push(`/?${newParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', newPage.toString());
    router.push(`/?${newParams.toString()}`);
  };

  return {
    results,
    loading,
    error,
    totalCount,
    page,
    totalPages,
    currentSearch,
    handleSearch,
    handlePageChange,
  };
}