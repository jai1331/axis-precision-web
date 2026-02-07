const mongoose = require('mongoose');

// SINGLE SOURCE OF TRUTH - used by server.js (Render) and by server/index.ts via re-export
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

// Safe export: reuse existing model if already registered (avoids duplicate model + uses latest schema on fresh start)
module.exports =
  mongoose.models.employeeForm ||
  mongoose.model('employeeForm', employeeFormSchema);
