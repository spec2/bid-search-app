import { NextResponse } from 'next/server';

export async function GET() {
  const workerUrl = process.env.BIDS_API_WORKER_URL;

  if (!workerUrl) {
    return NextResponse.json(
      { error: 'BIDS_API_WORKER_URL is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(workerUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch from worker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the worker' },
      { status: 502 } // Bad Gateway
    );
  }
}