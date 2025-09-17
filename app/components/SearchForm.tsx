"use client";

import { useState, useEffect } from 'react';
import { Search, Building, RotateCw } from 'lucide-react';
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

interface SearchFormProps {
  onSearch: (params: { query: string; company: string; ministry: string; startDate: string; endDate: string; }) => void;
  loading: boolean;
}

const SearchForm = ({ onSearch, loading }: SearchFormProps) => {
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
  const [ministry, setMinistry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ministries, setMinistries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    onSearch({ query, company, ministry, startDate, endDate });
  };

  const handleResetClick = () => {
    setQuery('');
    setCompany('');
    setMinistry('');
    setStartDate('');
    setEndDate('');
    onSearch({ query: '', company: '', ministry: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-center text-destructive mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
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
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label>落札決定日</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="開始日"
            />
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="終了日"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 md:col-span-2 lg:col-span-3">
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