"use client";

import { FileSearch } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'yyyy年MM月dd日', { locale: ja });
  } catch (error) {
    return dateString;
  }
};

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
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">調達案件名称</TableHead>
              <TableHead>事業者名</TableHead>
              <TableHead>落札決定日</TableHead>
              <TableHead className="text-right">落札価格</TableHead>
              <TableHead>府省</TableHead>
              <TableHead>入札方式</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((bid, index) => (
              <TableRow key={index} className="odd:bg-muted">
                <TableCell className="font-medium">
                  <Tooltip>
                    <TooltipTrigger>
                      <p className="truncate max-w-md">{bid.調達案件名称}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{bid.調達案件名称}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>{bid.法人番号?.商号又は名称 || 'N/A'}</TableCell>
                <TableCell>{formatDate(bid.落札決定日)}</TableCell>
                <TableCell className="text-right">{formatPrice(bid.落札価格)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{bid.府省コード?.名称 || 'N/A'}</Badge>
                </TableCell>
                <TableCell>{bid.入札方式コード?.名称 || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default ResultsTable;