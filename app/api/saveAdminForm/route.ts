import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  
  const password = 'IronMan';
  const mongoUri = `mongodb+srv://admin:${password}@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority&appName=Cluster0`;
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Admin Entry Schema
const adminEntrySchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  componentName: { type: String, required: true },
  qty: { type: Number, required: true },
  dcno: { type: String, required: true },
  internalJobOrder: { type: String, required: true },
  supplierName: { type: String, required: true },
  rawMaterialPricePerKg: { type: Number, required: true },
  materialGrade: { type: String, required: true },
  rawMaterialCost: { type: Number, required: true },
  created: { type: Date, default: Date.now() }
}, { collection: 'adminEntryForm' });

// Get or create model
const getAdminEntryModel = () => {
  return mongoose.models.adminEntryForm || mongoose.model('adminEntryForm', adminEntrySchema);
};

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
    
    // Connect to MongoDB
    await connectDB();
    
    // Get the model
    const AdminEntryForm = getAdminEntryModel();
    
    // Create the entry with all fields
    const response = await AdminEntryForm.create({
      customerName: body.customerName,
      componentName: body.componentName,
      qty: body.qty,
      dcno: body.dcno,
      internalJobOrder: body.internalJobOrder,
      supplierName: body.supplierName,
      rawMaterialPricePerKg: body.rawMaterialPricePerKg,
      materialGrade: body.materialGrade,
      rawMaterialCost: body.rawMaterialCost
    });
    
    console.log('=== SAVED TO MONGODB ===');
    console.log('Full response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json({ 
      status: 'ok', 
      response: response 
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save admin form', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
} 