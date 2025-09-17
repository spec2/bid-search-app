"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from "date-fns";
import { ja } from 'date-fns/locale';
import { Search, Building, RotateCw, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar01 } from '@/components/calendar-01';
import { cn } from '@/lib/utils';

interface SearchParams {
  query: string;
  company: string;
  ministry: string;
  startDate: string;
  endDate: string;
}

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
  initialState: Partial<SearchParams>;
}

const SearchForm = ({ onSearch, loading, initialState }: SearchFormProps) => {
  const [query, setQuery] = useState(initialState.query || '');
  const [company, setCompany] = useState(initialState.company || '');
  const [ministry, setMinistry] = useState(initialState.ministry || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialState.startDate ? parseISO(initialState.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialState.endDate ? parseISO(initialState.endDate) : undefined
  );
  const [ministries, setMinistries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialState.query || '');
    setCompany(initialState.company || '');
    setMinistry(initialState.ministry || '');
    setStartDate(initialState.startDate ? parseISO(initialState.startDate) : undefined);
    setEndDate(initialState.endDate ? parseISO(initialState.endDate) : undefined);
  }, [initialState]);

  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const response = await fetch('/api/ministries');
        if (!response.ok) {
          throw new Error('Failed to fetch ministries');
        }
        const data = await response.json();
        setMinistries(data);
      } catch (e) {
        console.error(e);
        setError('府省一覧の取得に失敗しました。');
      }
    };
    fetchMinistries();
  }, []);

  const handleSearchClick = () => {
    onSearch({ 
      query, 
      company, 
      ministry, 
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : '', 
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : '' 
    });
  };

  const handleResetClick = () => {
    setQuery('');
    setCompany('');
    setMinistry('');
    setStartDate(undefined);
    setEndDate(undefined);
    onSearch({ query: '', company: '', ministry: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-center text-destructive mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-2">
          <Label htmlFor="query">案件名</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: システム開発"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">事業者名</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="例: 株式会社〇〇"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ministry">府省</Label>
          <Select value={ministry} onValueChange={(value) => setMinistry(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="すべての府省" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての府省</SelectItem>
              {ministries.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>落札決定日</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground pl-1">開始日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: ja }) : <span>日付を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar01 onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground pl-1">終了日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: ja }) : <span>日付を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar01 onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 md:col-span-3">
          <Button variant="outline" onClick={handleResetClick} disabled={loading}>
            <RotateCw className="mr-2 h-4 w-4" />
            リセット
          </Button>
          <Button onClick={handleSearchClick} disabled={loading} size="lg">
            {loading ? '検索中...' : <><Search className="mr-2 h-4 w-4" />検索する</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;