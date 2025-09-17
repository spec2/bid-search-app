import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CsvData {
  調達案件名称?: string;
  法人番号?: { 商号又は名称?: string } | null;
  落札決定日?: string;
  落札価格?: number;
  府省コード?: { 名称?: string } | null;
  入札方式コード?: { 名称?: string } | null;
}

export function exportToCsv(data: CsvData[], fileName: string) {
  if (!data || data.length === 0) {
    return;
  }

  const headers = [
    "調達案件名称",
    "事業者名",
    "落札決定日",
    "落札価格",
    "府省",
    "入札方式",
  ];

  const csv = [
    headers.join(','),
    ...data.map(row => {
      const escapedData = [
        row.調達案件名称 ? `"${row.調達案件名称.replace(/"/g, '""')}"` : '""',
        row.法人番号?.商号又は名称 ? `"${row.法人番号.商号又は名称.replace(/"/g, '""')}"` : '"N/A"',
        row.落札決定日 || '',
        row.落札価格 || '',
        row.府省コード?.名称 ? `"${row.府省コード.名称}"` : '"N/A"',
        row.入札方式コード?.名称 ? `"${row.入札方式コード.名称}"` : '"N/A"',
      ];
      return escapedData.join(',');
    })
  ].join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
