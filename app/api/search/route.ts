import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Use environment variable for the production API URL, fallback to localhost for development
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  console.log(`Using API base URL: ${baseUrl}`); // Log the base URL

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
    params.append('select', '*,companies:法人番号(商号又は名称),ministries:府省コード(名称),bid_methods:入札方式コード(名称)');
    
    if (query) {
      const keywords = query.split(/\s+/).filter(Boolean);
      const andConditions = keywords.map(k => `調達案件名称.ilike.*${k}*`).join(',');
      params.append('and', `(${andConditions})`);
    }
    if (company) {
      params.append('法人番号.商号又は名称', `ilike.*${company}*`);
    }
    if (ministry) {
      params.append('府省コード.名称', `eq.${ministry}`);
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

    const resultsUrl = `${baseUrl}/bids?${params.toString()}`;
    const countUrl = `${baseUrl}/rpc/search_bids_count`;
    console.log(`Fetching results from: ${resultsUrl}`); // Log the full URL

    // For total count, call the RPC function
    const countPayload = {
      query: query,
      company: company,
      ministry: ministry || '',
      start_date: startDate || null,
      end_date: endDate || null,
    };

    const [resultsResponse, countResponse] = await Promise.all([
      fetch(resultsUrl, { cache: 'no-store' }), // Add cache: 'no-store'
      fetch(countUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countPayload),
        cache: 'no-store', // Add cache: 'no-store'
      })
    ]);

    if (!resultsResponse.ok) {
      console.error('Results fetch response:', await resultsResponse.text());
      throw new Error(`Results fetch failed: ${resultsResponse.statusText}`);
    }
    if (!countResponse.ok) {
      console.error('Count fetch response:', await countResponse.text());
      throw new Error(`Count fetch failed: ${countResponse.statusText}`);
    }

    const results = await resultsResponse.json();
    const totalCount = await countResponse.json();

    return NextResponse.json({ results, totalCount });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({ message: 'Failed to execute query', error: message });
    return NextResponse.json({ error: 'Query failed', details: message }, { status: 500 });
  }
}
