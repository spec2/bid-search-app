import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  company_name: string;
  ministry_name: string;
  bid_method_name: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    // Correct way to access bindings with @opennextjs/cloudflare
    const { env } = getCloudflareContext();
    const db = env.DB;

    if (!db) {
      return NextResponse.json({ error: 'Database binding not found' }, { status: 500 });
    }

    const searchTerm = `%${query}%`;
    const limit = 50;

    const stmt = db.prepare(`
      SELECT
        b.調達案件名称,
        b.落札決定日,
        b.落札価格,
        c.商号又は名称 AS company_name,
        m.名称 AS ministry_name,
        bm.名称 AS bid_method_name
      FROM bids AS b
      JOIN companies AS c ON b.法人番号 = c.法人番号
      JOIN ministries AS m ON b.府省コード = m.コード
      JOIN bid_methods AS bm ON b.入札方式コード = bm.コード
      WHERE
        b.調達案件名称 LIKE ?1 OR
        c.商号又は名称 LIKE ?1
      ORDER BY b.落札決定日 DESC
      LIMIT ?2
    `).bind(searchTerm, limit);

    const { results } = await stmt.all<Bid>();

    return NextResponse.json(results);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({ message: 'Failed to execute query', error: message });
    return NextResponse.json({ error: 'Query failed', details: message }, { status: 500 });
  }
}
