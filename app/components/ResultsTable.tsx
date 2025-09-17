"use client";

import { FileSearch } from 'lucide-react';

interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  法人番号: { 商号又は名称: string } | null;
  府省コード: { 名称: string } | null;
  入札方式コード: { 名称: string } | null;
}

interface ResultsTableProps {
  results: Bid[];
  loading: boolean;
  searched: boolean;
}

const formatPrice = (price: number) => {
  if (typeof price !== 'number') return '';
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
}

const ResultsTable = ({ results, loading, searched }: ResultsTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
        <p className="text-muted-foreground">検索中...</p>
      </div>
    );
  }

  if (!searched) {
    return null;
  }
  
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileSearch className="mx-auto h-12 w-12" />
        <h3 className="mt-2 text-sm font-medium text-foreground">検索結果がありません</h3>
        <p className="mt-1 text-sm">検索条件を変更して、再度お試しください。</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="px-2 py-2 border">調達案件名称</th>
            <th className="px-2 py-2 border">事業者名</th>
            <th className="px-2 py-2 border">落札決定日</th>
            <th className="px-2 py-2 border text-right">落札価格</th>
            <th className="px-2 py-2 border">府省</th>
            <th className="px-2 py-2 border">入札方式</th>
          </tr>
        </thead>
        <tbody>
          {results.map((bid, index) => (
            <tr key={index}>
              <td className="border px-2 py-1 font-medium">{bid.調達案件名称}</td>
              <td className="border px-2 py-1">{bid.法人番号?.商号又は名称 || 'N/A'}</td>
              <td className="border px-2 py-1">{bid.落札決定日}</td>
              <td className="border px-2 py-1 text-right">{formatPrice(bid.落札価格)}</td>
              <td className="border px-2 py-1">{bid.府省コード?.名称 || 'N/A'}</td>
              <td className="border px-2 py-1">{bid.入札方式コード?.名称 || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;