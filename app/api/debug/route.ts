import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return NextResponse.json({
      error: "API_URL environment variable is not set in Vercel.",
      apiUrlUsed: null,
      connectionTest: null,
    }, { status: 500 });
  }

  try {
    // Test the connection with a simple request. 
    // We use the base URL and expect it to respond, even if it's a PostgREST help page.
    const response = await fetch(apiUrl, { cache: 'no-store' });

    // If we get here, the fetch itself didn't throw an error
    const connectionTestResult = {
      success: true,
      statusCode: response.status,
      statusText: response.statusText,
    };

    return NextResponse.json({
      message: "Debug information retrieved successfully.",
      apiUrlUsed: apiUrl,
      connectionTest: connectionTestResult,
    });

  } catch (e) {
    // This block will be executed if the fetch fails (e.g., DNS error, connection refused)
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      error: "Failed to connect to the API_URL.",
      apiUrlUsed: apiUrl,
      connectionTest: {
        success: false,
        error: message,
        cause: e instanceof Error ? e.cause : null, // Provides more detail on fetch failures
      },
    }, { status: 500 });
  }
}
