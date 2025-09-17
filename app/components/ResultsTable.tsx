"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>調達案件名称</TableHead>
            <TableHead>事業者名</TableHead>
            <TableHead>落札決定日</TableHead>
            <TableHead className="text-right">落札価格</TableHead>
            <TableHead>府省</TableHead>
            <TableHead>入札方式</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((bid, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{bid.調達案件名称}</TableCell>
              <TableCell>{bid.法人番号?.商号又は名称 || 'N/A'}</TableCell>
              <TableCell>{bid.落札決定日}</TableCell>
              <TableCell className="text-right">{formatPrice(bid.落札価格)}</TableCell>
              <TableCell>{bid.府省コード?.名称 || 'N/A'}</TableCell>
              <TableCell>{bid.入札方式コード?.名称 || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;