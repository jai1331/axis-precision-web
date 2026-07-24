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

// Keep machine as free String so new machines (e.g. VMC-2) save without redeploy enum updates
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

const getEmployeeFormModel = () => {
  return mongoose.models.employeeForm || mongoose.model('employeeForm', employeeFormSchema);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
};

const normalizeDate = (date: unknown) => {
  if (!date) return new Date();
  if (String(date).includes('T')) return new Date(String(date));
  const parts = String(date).split('-');
  if (parts.length === 3) {
    // Supports DD-MM-YYYY from older clients
    const [day, month, year] = parts;
    return new Date(`${month}-${day}-${year}`);
  }
  return new Date(String(date));
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const EmployeeForm = getEmployeeFormModel();
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const entry = await EmployeeForm.findById(id);
      if (!entry) {
        return NextResponse.json(
          { error: 'Employee entry not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      return NextResponse.json(entry, { headers: corsHeaders });
    }

    const data = await EmployeeForm.find({}).sort({ date: -1 });
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Get employee form error:', error);
    // Fallback to production list if direct DB read fails
    try {
      const id = request.nextUrl.searchParams.get('id');
      const response = await fetch('https://axis-precision-app.onrender.com/api/employeeForm');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (id) {
        const matched = Array.isArray(data)
          ? data.find((item: any) => String(item._id) === String(id))
          : null;
        if (!matched) {
          return NextResponse.json(
            { error: 'Employee entry not found' },
            { status: 404, headers: corsHeaders }
          );
        }
        return NextResponse.json(matched, { headers: corsHeaders });
      }
      return NextResponse.json(data, { headers: corsHeaders });
    } catch (fallbackError) {
      console.error('Fallback get employee form error:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to fetch employee form data' },
        { status: 500, headers: corsHeaders }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('employeeForm POST body:', body);

    await connectDB();
    const EmployeeForm = getEmployeeFormModel();

    const { id, _id, ...rest } = body;
    const payload = {
      ...rest,
      date: normalizeDate(body.date),
      additionalQty: body.additionalQty ?? 0,
      remarks: body.remarks ?? '',
    };

    const response = await EmployeeForm.create(payload);
    console.log('employeeForm saved:', response._id, 'machine:', response.machine);

    return NextResponse.json(
      { status: 'ok', response },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Save employee form error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save employee form',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const entryId = body.id || body._id;

    if (!entryId) {
      return NextResponse.json(
        { status: 'error', error: 'Entry id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();
    const EmployeeForm = getEmployeeFormModel();

    const { id, _id, ...rest } = body;
    const updateData = {
      ...rest,
      date: normalizeDate(body.date),
    };

    const response = await EmployeeForm.findOneAndUpdate(
      { _id: entryId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!response) {
      return NextResponse.json(
        { status: 'error', error: 'Employee entry not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { status: 'ok', response },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Update employee form error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update employee form',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
