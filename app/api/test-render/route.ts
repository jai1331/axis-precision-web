import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the Render server with a simple request
    const testData = {
      customerName: "Test Customer",
      componentName: "Test Component", 
      qty: 100,
      dcno: "TEST-DC-001",
      internalJobOrder: "TEST-JO-001",
      supplierName: "Test Supplier",
      rawMaterialPricePerKg: 150.50,
      materialGrade: "Grade A",
      rawMaterialCost: 15050
    };

    console.log('Testing Render server with data:', testData);

    const response = await fetch('https://axis-precision-app.onrender.com/api/saveAdminForm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();
    
    console.log('Render server test response:', data);

    return NextResponse.json({
      status: 'success',
      renderServerResponse: data,
      testData: testData,
      renderServerStatus: response.status
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 