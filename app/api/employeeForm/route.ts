import { NextRequest, NextResponse } from 'next/server';

// Use local Express server in dev so you can test schema fixes without redeploying Render
const BACKEND_BASE =
  process.env.USE_LOCAL_API === 'true' || process.env.NODE_ENV === 'development'
    ? 'http://localhost:9000'
    : 'https://axis-precision-app.onrender.com';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const apiUrl = `${BACKEND_BASE}/api/employeeForm`;
    
    console.log('Proxying employeeForm GET request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee form data' },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = `${BACKEND_BASE}/api/employeeForm`;
    
    console.log('Proxying employeeForm POST request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Production server error:', errorText);
      return NextResponse.json(
        { error: 'Failed to save employee form' },
        { status: response.status, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to save employee form' },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
} 

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = `${BACKEND_BASE}/api/updateEmployeeForm`;
    
    console.log('Proxying employeeForm PUT request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Production server error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update employee form' },
        { status: response.status, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update employee form' },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
} 