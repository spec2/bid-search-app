import { NextResponse } from 'next/server';
import { createDbPool } from '../../../lib/db';

export async function GET() {
  const pool = createDbPool();

  try {
    const { rows } = await pool.query(`SELECT "名称" FROM ministries ORDER BY "コード"`);
    const ministryNames = rows.map((row: { 名称: string }) => row.名称);

    return NextResponse.json(ministryNames);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error({ message: 'Failed to fetch ministries', error: message });
    return NextResponse.json({ error: 'Failed to fetch ministries', details: message }, { status: 500 });
  } finally {
    pool.end();
  }
}