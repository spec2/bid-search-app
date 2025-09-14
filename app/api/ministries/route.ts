import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface Ministry {
  名称: string;
}

export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;

    if (!db) {
      return NextResponse.json({ error: 'Database binding not found' }, { status: 500 });
    }

    const stmt = db.prepare(`
      SELECT 名称 FROM ministries ORDER BY コード
    `);
    
    const { results } = await stmt.all<Ministry>();
    const ministryNames = results.map((item: Ministry) => item.名称);

    return NextResponse.json(ministryNames);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({ message: 'Failed to fetch ministries', error: message });
    return NextResponse.json({ error: 'Failed to fetch ministries', details: message }, { status: 500 });
  }
}
