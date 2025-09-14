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
    const ministry = searchParams.get('ministry');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { env } = getCloudflareContext();
    const db = env.DB;

    if (!db) {
      return NextResponse.json({ error: 'Database binding not found' }, { status: 500 });
    }

    const whereClauses = [];
    const bindings = [];
    let paramIndex = 1;

    // Keywords search
    if (query) {
      const keywords = query.split(/\s+/).filter(Boolean); // Split by space and remove empty strings
      const keywordClauses = keywords.map(keyword => {
        bindings.push(`%${keyword}%`, `%${keyword}%`);
        return `(b.調達案件名称 LIKE ?${paramIndex++} OR c.商号又は名称 LIKE ?${paramIndex++})`;
      });
      if (keywordClauses.length > 0) {
        whereClauses.push(`(${keywordClauses.join(' AND ')})`);
      }
    }

    // Ministry filter
    if (ministry) {
      whereClauses.push(`m.名称 = ?${paramIndex++}`);
      bindings.push(ministry);
    }

    // Date range filter
    if (startDate) {
      whereClauses.push(`b.落札決定日 >= ?${paramIndex++}`);
      bindings.push(startDate);
    }
    if (endDate) {
      whereClauses.push(`b.落札決定日 <= ?${paramIndex++}`);
      bindings.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const limit = 50;
    bindings.push(limit);

    const sql = `
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
      ${whereSql}
      ORDER BY b.落札決定日 DESC
      LIMIT ?${paramIndex}
    `;

    const stmt = db.prepare(sql).bind(...bindings);
    const { results } = await stmt.all<Bid>();

    return NextResponse.json(results);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const errorLog: { message: string, error: string, sql?: unknown, bindings?: unknown } = {
      message: 'Failed to execute query',
      error: message,
    };
    if (typeof e === 'object' && e !== null) {
      if ('sql' in e) errorLog.sql = e.sql;
      if ('bindings' in e) errorLog.bindings = e.bindings;
    }
    console.error(errorLog);
    return NextResponse.json({ error: 'Query failed', details: message }, { status: 500 });
  }
}
