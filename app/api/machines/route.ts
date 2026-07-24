import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { DEFAULT_MACHINES, normalizeMachineName } from '@/lib/machines';

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

const machineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
    created: { type: Date, default: Date.now },
  },
  { collection: 'machines' }
);

const getMachineModel = () => {
  return mongoose.models.machines || mongoose.model('machines', machineSchema);
};

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

async function ensureDefaultMachines() {
  const Machine = getMachineModel();
  const count = await Machine.countDocuments();
  if (count > 0) return;

  await Machine.insertMany(
    DEFAULT_MACHINES.map((name) => ({ name, active: true })),
    { ordered: false }
  ).catch(() => {
    // ignore duplicate race on first seed
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultMachines();
    const Machine = getMachineModel();
    const docs = await Machine.find({ active: { $ne: false } }).sort({ name: 1 });
    const names = docs.map((d: any) => d.name);

    // Always include defaults even if somehow missing from DB
    const merged = Array.from(new Set([...DEFAULT_MACHINES, ...names]));
    merged.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return NextResponse.json(
      { status: 'ok', machines: merged, records: docs },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get machines error:', error);
    return NextResponse.json(
      { status: 'ok', machines: DEFAULT_MACHINES, records: [] },
      { headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = normalizeMachineName(body?.name || body?.machine);

    if (!name) {
      return NextResponse.json(
        { status: 'error', error: 'Machine name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { status: 'error', error: 'Machine name must be at least 2 characters' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();
    await ensureDefaultMachines();
    const Machine = getMachineModel();

    const existing = await Machine.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      if (existing.active === false) {
        existing.active = true;
        await existing.save();
        return NextResponse.json(
          { status: 'ok', response: existing, message: 'Machine reactivated' },
          { headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { status: 'error', error: `Machine "${existing.name}" already exists` },
        { status: 409, headers: corsHeaders }
      );
    }

    const response = await Machine.create({ name, active: true });
    return NextResponse.json(
      { status: 'ok', response },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Save machine error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to save machine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
