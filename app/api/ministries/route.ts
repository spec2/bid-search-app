import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  console.log(`[ministries] Using API base URL: ${baseUrl}`);

  try {
    const url = `${baseUrl}/ministries?select=名称&order=コード`;
    console.log(`[ministries] Fetching from: ${url}`);
    
    // Add cache: 'no-store' to disable caching
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      console.error('[ministries] API response not ok:', await response.text());
      throw new Error(`PostgREST request failed: ${response.statusText}`);
    }
    
    const data: { 名称: string }[] = await response.json();
    const ministryNames = data.map(item => item.名称);

    return NextResponse.json(ministryNames);
  } catch (e) {
    // Log the full error object for more details on "fetch failed"
    console.error({ message: 'Failed to fetch ministries', error: e });
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Failed to fetch ministries', details: message }, { status: 500 });
  }
}
