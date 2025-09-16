import { NextRequest, NextResponse } from 'next/server';
import { createDbPool } from '../../../lib/db';

interface Bid {
  調達案件名称: string;
  落札決定日: string;
  落札価格: number;
  company_name: string;
  ministry_name: string;
  bid_method_name: string;
}

export async function GET(req: NextRequest) {
  const pool = createDbPool();

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

    const bindings: (string | number)[] = [];
    let paramIndex = 1;
    const whereClauses: string[] = [];

    if (query) {
      const keywords = query.split(/\s+/).filter(Boolean);
      const keywordClauses = keywords.map(keyword => {
        bindings.push(`%${keyword}%`);
        return `b."調達案件名称" ILIKE $${paramIndex++}`;
      });
      if (keywordClauses.length > 0) {
        whereClauses.push(`(${keywordClauses.join(' AND ')})`);
      }
    }
    if (company) {
      bindings.push(`%${company}%`);
      whereClauses.push(`c."商号又は名称" ILIKE $${paramIndex++}`);
    }
    if (ministry) {
      bindings.push(ministry);
      whereClauses.push(`m."名称" = $${paramIndex++}`);
    }
    if (startDate) {
      bindings.push(startDate);
      whereClauses.push(`b."落札決定日" >= $${paramIndex++}`);
    }
    if (endDate) {
      bindings.push(endDate);
      whereClauses.push(`b."落札決定日" <= $${paramIndex++}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM bids AS b
      JOIN companies AS c ON b."法人番号" = c."法人番号"
      JOIN ministries AS m ON b."府省コード" = m."コード"
      ${whereSql}
    `;

    const resultsSql = `
      SELECT
        b."調達案件名称",
        b."落札決定日",
        b."落札価格",
        c."商号又は名称" AS company_name,
        m."名称" AS ministry_name,
        bm."名称" AS bid_method_name
      FROM bids AS b
      JOIN companies AS c ON b."法人番号" = c."法人番号"
      JOIN ministries AS m ON b."府省コード" = m."コード"
      JOIN bid_methods AS bm ON b."入札方式コード" = bm."コード"
      ${whereSql}
      ORDER BY b."落札決定日" DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const [countResult, resultsResult] = await Promise.all([
      pool.query(countSql, bindings),
      pool.query(resultsSql, [...bindings, limit, offset])
    ]);

    const totalCount = parseInt(countResult.rows[0].total, 10) || 0;
    const results = resultsResult.rows as Bid[];

    return NextResponse.json({ results, totalCount });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({
      message: 'Failed to execute query',
      error: message,
    });
    return NextResponse.json({ error: 'Query failed', details: message }, { status: 500 });
  } finally {
    pool.end();
  }
}
