import { NextResponse } from 'next/server';

export async function GET() {
  // In production, DB_HOSTNAME is set via wrangler.toml.
  // In local dev, we connect to the local postgrest container.
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = isDevelopment ? 'http://localhost:3001' : `https://${process.env.DB_HOSTNAME}`;

  try {
    const response = await fetch(`${baseUrl}/ministries?select=名称&order=コード`);
    if (!response.ok) {
      throw new Error(`PostgREST request failed: ${response.statusText}`);
    }
    const data: { 名称: string }[] = await response.json();
    const ministryNames = data.map(item => item.名称);

    return NextResponse.json(ministryNames);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({ message: 'Failed to fetch ministries', error: message });
    return NextResponse.json({ error: 'Failed to fetch ministries', details: message }, { status: 500 });
  }
}
