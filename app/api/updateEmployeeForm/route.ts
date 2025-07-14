import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = 'https://axis-precision-app.onrender.com/api/updateEmployeeForm';
    
    console.log('Proxying updateEmployeeForm PUT request to:', apiUrl);
    console.log('Request body:', body);
    
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
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update employee form' },
      { status: 500 }
    );
  }
} 