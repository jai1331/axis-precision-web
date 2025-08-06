import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, let's proxy to Render but also log the request
    const apiUrl = 'https://axis-precision-app.onrender.com/api/saveAdminForm';

    console.log('Proxying saveAdminForm POST request to:', apiUrl);
    console.log('Request body:', body);
    console.log('New fields present:', {
      supplierName: body.supplierName,
      rawMaterialPricePerKg: body.rawMaterialPricePerKg,
      materialGrade: body.materialGrade,
      rawMaterialCost: body.rawMaterialCost
    });

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
        { error: 'Failed to save admin form' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Response from Render server:', data);
    
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to save admin form' },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
} 