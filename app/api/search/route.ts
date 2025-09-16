import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = isDevelopment ? 'http://localhost:3001' : `https://${process.env.DB_HOSTNAME}`;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const company = searchParams.get('company') || '';
    const ministry = searchParams.get('ministry');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);

    const limit = 50;
    const offset = (page - 1) * limit;

    // Construct PostgREST query parameters
    const params = new URLSearchParams();
    params.append('select', '調達案件名称,落札決定日,落札価格,company:companies(company_name:商号又は名称),ministry:ministries(ministry_name:名称),bid_method:bid_methods(bid_method_name:名称)');
    
    if (query) {
      const keywords = query.split(/\s+/).filter(Boolean);
      const andConditions = keywords.map(k => `調達案件名称.ilike.*${k}*`).join(',');
      params.append('and', `(${andConditions})`);
    }
    if (company) {
      params.append('company.商号又は名称', `ilike.*${company}*`);
    }
    if (ministry) {
      params.append('ministry.名称', `eq.${ministry}`);
    }
    if (startDate) {
      params.append('落札決定日', `gte.${startDate}`);
    }
    if (endDate) {
      params.append('落札決定日', `lte.${endDate}`);
    }

    params.append('order', '落札決定日.desc');
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    // For total count, call the RPC function
    const countPayload = {
      query: query,
      company: company,
      ministry: ministry || '',
      start_date: startDate || null,
      end_date: endDate || null,
    };

    const [resultsResponse, countResponse] = await Promise.all([
      fetch(`${baseUrl}/bids?${params.toString()}`),
      fetch(`${baseUrl}/rpc/search_bids_count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countPayload),
      })
    ]);

    if (!resultsResponse.ok) throw new Error(`Results fetch failed: ${resultsResponse.statusText}`);
    if (!countResponse.ok) throw new Error(`Count fetch failed: ${countResponse.statusText}`);

    const results = await resultsResponse.json();
    const totalCount = await countResponse.json();

    return NextResponse.json({ results, totalCount });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({ message: 'Failed to execute query', error: message });
    return NextResponse.json({ error: 'Query failed', details: message }, { status: 500 });
  }
}
