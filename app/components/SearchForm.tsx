"use client";

import { useState, useEffect } from 'react';
import { Search, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      {error && <p className="text-center text-destructive mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="query">案件名</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: PC"
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
              placeholder="例: 日本電気"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ministry">府省</Label>
          {/* This will be replaced with shadcn/ui Select later */}
          <select
            id="ministry"
            value={ministry}
            onChange={(e) => setMinistry(e.target.value)}
            className="w-full h-10 border border-input bg-background rounded-md px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">すべての府省</option>
            {ministries.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-date">開始日</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">終了日</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <Button onClick={handleSearchClick} disabled={loading} size="lg">
          {loading ? '検索中...' : <><Search className="mr-2 h-4 w-4" />検索</>}
        </Button>
      </div>
    </div>
  );
};

export default SearchForm;