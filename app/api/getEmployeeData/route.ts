import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { fetchEmployeeRecords } from '@/lib/employeeDateQuery.js';

export const dynamic = 'force-dynamic';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  const password = 'IronMan';
  const mongoUri = `mongodb+srv://admin:${password}@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority&appName=Cluster0`;

  await mongoose.connect(mongoUri);
};

const employeeFormSchema = new mongoose.Schema(
  {},
  { collection: 'employeeForm', strict: false }
);

const getEmployeeFormModel = () => {
  return mongoose.models.employeeForm || mongoose.model('employeeForm', employeeFormSchema);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();
    const EmployeeForm = getEmployeeFormModel();

    const data = await fetchEmployeeRecords(EmployeeForm, startDate, endDate);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('getEmployeeData error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee data' },
      { status: 500 }
    );
  }
}
