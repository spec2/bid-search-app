"use client";

import { useState, useMemo } from 'react';
import { FileSearch, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type SortKey = '落札決定日' | '落札価格';
type SortDirection = 'asc' | 'desc';

const formatPrice = (price: number) => {
  if (typeof price !== 'number') return '';
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'yyyy年MM月dd日', { locale: ja });
  } catch (error) {
    return dateString;
  }
};

const ResultsTable = ({ results, loading, searched }: ResultsTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('落札決定日');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedResults = useMemo(() => {
    const sorted = [...results];
    sorted.sort((a, b) => {
      if (sortKey === '落札価格') {
        return sortDirection === 'asc' ? a.落札価格 - b.落札価格 : b.落札価格 - a.落札価格;
      }
      if (sortKey === '落札決定日') {
        const dateA = new Date(a.落札決定日).getTime();
        const dateB = new Date(b.落札決定日).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    return sorted;
  }, [results, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

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
    <div>
      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">調達案件名称</TableHead>
              <TableHead>事業者名</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('落札決定日')}>
                  落札決定日
                  <SortIcon columnKey="落札決定日" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('落札価格')}>
                  落札価格
                  <SortIcon columnKey="落札価格" />
                </Button>
              </TableHead>
              <TableHead>府省</TableHead>
              <TableHead>入札方式</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((bid, index) => (
              <TableRow key={index} className="odd:bg-muted hover:bg-accent">
                <TableCell className="font-medium whitespace-normal break-words">
                  {bid.調達案件名称}
                </TableCell>
                <TableCell>{bid.法人番号?.商号又は名称 || 'N/A'}</TableCell>
                <TableCell>{formatDate(bid.落札決定日)}</TableCell>
                <TableCell className="text-right">{formatPrice(bid.落札価格)}</TableCell>
                <TableCell className="w-[150px]">
                  <Badge variant="secondary">{bid.府省コード?.名称 || 'N/A'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{bid.入札方式コード?.名称 || 'N/A'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="block md:hidden space-y-4">
        {sortedResults.map((bid, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base break-words">{bid.調達案件名称}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold">事業者名</p>
                <p>{bid.法人番号?.商号又は名称 || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">落札決定日</p>
                <p>{formatDate(bid.落札決定日)}</p>
              </div>
              <div>
                <p className="font-semibold">落札価格</p>
                <p>{formatPrice(bid.落札価格)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold">府省:</p>
                <Badge variant="secondary">{bid.府省コード?.名称 || 'N/A'}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold">入札方式:</p>
                <Badge variant="outline">{bid.入札方式コード?.名称 || 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResultsTable;