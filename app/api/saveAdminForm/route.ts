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
    
    console.log('=== SAVE ADMIN FORM REQUEST ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('New fields check:', {
      supplierName: body.supplierName,
      rawMaterialPricePerKg: body.rawMaterialPricePerKg,
      materialGrade: body.materialGrade,
      rawMaterialCost: body.rawMaterialCost
    });
    
    // For now, let's proxy to Render but also log the request
    const apiUrl = 'https://axis-precision-app.onrender.com/api/saveAdminForm';

    console.log('Proxying saveAdminForm POST request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Render server response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Production server error:', errorText);
      return NextResponse.json(
        { error: 'Failed to save admin form' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('=== RENDER SERVER RESPONSE ===');
    console.log('Full response:', JSON.stringify(data, null, 2));
    
    // Check if new fields are in the response
    if (data.response) {
      console.log('Response fields check:', {
        supplierName: data.response.supplierName,
        rawMaterialPricePerKg: data.response.rawMaterialPricePerKg,
        materialGrade: data.response.materialGrade,
        rawMaterialCost: data.response.rawMaterialCost
      });
    }
    
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