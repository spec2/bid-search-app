"use client";

interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  company_name: string;
  ministry_name: string;
  bid_method_name: string;
}

interface ResultsTableProps {
  results: Bid[];
  loading: boolean;
  searched: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
}

const ResultsTable = ({ results, loading, searched }: ResultsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">調達案件名称</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事業者名</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">落札決定日</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">落札価格</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">府省</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入札方式</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-500">検索中...</td>
            </tr>
          ) : results.length > 0 ? (
            results.map((bid, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-800">{bid.調達案件名称}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.company_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.落札決定日}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatPrice(bid.落札価格)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.ministry_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bid.bid_method_name}</td>
              </tr>
            ))
          ) : searched && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-500">検索結果が見つかりませんでした。</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
