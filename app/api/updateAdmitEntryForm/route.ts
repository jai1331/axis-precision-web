import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  const password = 'IronMan';
  const mongoUri = `mongodb+srv://admin:${password}@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority&appName=Cluster0`;

  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

const adminEntrySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    componentName: { type: String, required: true },
    qty: { type: Number, required: true },
    dcno: { type: String, required: true },
    internalJobOrder: { type: String, required: true },
    supplierName: { type: String, required: true },
    rawMaterialPricePerKg: { type: Number, required: true },
    materialGrade: { type: String, required: true },
    rawMaterialCost: { type: Number, required: true },
    created: { type: Date, default: Date.now },
  },
  { collection: 'adminEntryForm' }
);

const getAdminEntryModel = () => {
  return mongoose.models.adminEntryForm || mongoose.model('adminEntryForm', adminEntrySchema);
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const entryId = body.id || body._id;

    if (!entryId) {
      return NextResponse.json(
        { status: 'error', error: 'Entry id is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    await connectDB();
    const AdminEntryForm = getAdminEntryModel();

    const updateData = {
      customerName: body.customerName,
      componentName: body.componentName,
      qty: body.qty,
      dcno: body.dcno,
      internalJobOrder: body.internalJobOrder,
      supplierName: body.supplierName,
      rawMaterialPricePerKg: body.rawMaterialPricePerKg,
      materialGrade: body.materialGrade,
      rawMaterialCost: body.rawMaterialCost,
    };

    const response = await AdminEntryForm.findOneAndUpdate(
      { _id: entryId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!response) {
      return NextResponse.json(
        { status: 'error', error: 'Admin entry not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return NextResponse.json(
      { status: 'ok', response },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('Update admin entry error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to update admin entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
