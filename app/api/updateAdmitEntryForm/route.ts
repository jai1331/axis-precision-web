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
    poPrice: { type: Number, min: 0, default: 0 },
    supplierName: { type: String, required: true },
    rawMaterialPricePerKg: { type: Number, required: true },
    materialGrade: { type: String, required: true },
    rawMaterialCost: { type: Number, required: true },
    created: { type: Date, default: Date.now },
  },
  { collection: 'adminEntryForm' }
);

const employeeFormSchema = new mongoose.Schema(
  {
    operatorName: { type: String, required: true },
    date: { type: Date, required: true },
    shift: { type: String, required: true },
    machine: { type: String, required: true },
    customerName: { type: String, required: true },
    componentName: { type: String, required: true },
    qty: { type: Number, required: true },
    additionalQty: { type: Number, default: 0 },
    opn: { type: String, required: true },
    progNo: { type: String, required: true },
    internalJobOrder: { type: String, required: true },
    settingTime: { type: String },
    cycleTime: { type: String, required: true },
    handlingTime: { type: String, required: true },
    idleTime: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    remarks: { type: String },
    totalProductionHr: { type: String },
    totalWorkingHrs: { type: String },
  },
  { collection: 'employeeForm', timestamps: true }
);

const getAdminEntryModel = () => {
  return mongoose.models.adminEntryForm || mongoose.model('adminEntryForm', adminEntrySchema);
};

const getEmployeeFormModel = () => {
  return mongoose.models.employeeForm || mongoose.model('employeeForm', employeeFormSchema);
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
    const EmployeeForm = getEmployeeFormModel();

    const existingEntry = await AdminEntryForm.findById(entryId);
    if (!existingEntry) {
      return NextResponse.json(
        { status: 'error', error: 'Admin entry not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const updateData = {
      customerName: body.customerName,
      componentName: body.componentName,
      qty: body.qty,
      dcno: body.dcno,
      internalJobOrder: body.internalJobOrder,
      poPrice: body.poPrice,
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

    // Sync component name to employee/dashboard records only when admin corrects component name
    let employeeSyncedCount = 0;
    if (body.componentName !== existingEntry.componentName) {
      const syncResult = await EmployeeForm.updateMany(
        {
          customerName: existingEntry.customerName,
          internalJobOrder: existingEntry.internalJobOrder,
          componentName: existingEntry.componentName,
        },
        { $set: { componentName: body.componentName } }
      );
      employeeSyncedCount = syncResult.nModified ?? 0;
    }

    return NextResponse.json(
      { status: 'ok', response, employeeSyncedCount },
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
