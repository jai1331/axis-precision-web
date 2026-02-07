import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // const { searchParams } = new URL(request.url);
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const apiUrl = `https://axis-precision-app.onrender.com/api/getEmployeeData?startDate=${startDate}&endDate=${endDate}`;

    console.log('Proxying getEmployeeData request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 👈 important for server freshness
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Production server error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch employee data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee data' },
      { status: 500 }
    );
  }
}
