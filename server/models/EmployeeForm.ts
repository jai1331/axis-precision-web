import mongoose, { Schema, Document } from 'mongoose';
import { EmployeeForm } from '../../types';

// Avoid _id conflict by omitting it from EmployeeForm and letting Document supply it
export interface EmployeeFormDocument extends Omit<EmployeeForm, '_id'>, Document {}

const EmployeeFormSchema: Schema = new Schema(
  {
    operatorName: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    shift: {
      type: String,
      required: [true, 'Shift is required'],
      enum: ['First', 'Second', 'Third', '12hrMng', '12hrNight', 'Day', 'Night', 'General'],
    },
    machine: {
      type: String,
      required: [true, 'Machine is required'],
      enum: ['TC-1', 'TC-2', 'TC-3', 'VMC'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    componentName: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true,
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    additionalQty: {
      type: Number,
      default: 0,
      min: [0, 'Additional quantity cannot be negative'],
    },
    opn: {
      type: String,
      required: [true, 'OPN is required'],
      enum: ['preMC', 'first_opn', 'second_opn', 'third_opn', 'fourth_opn', 'R/W'],
    },
    progNo: {
      type: String,
      required: [true, 'Program number is required'],
      trim: true,
    },
    internalJobOrder: { type: String, required: true },
    settingTime: {
      type: String,
      required: [true, 'Setting time is required'],
      default: '00:00:00',
    },
    cycleTime: {
      type: String,
      required: [true, 'Cycle time is required'],
      default: '00:00:00',
    },
    handlingTime: {
      type: String,
      required: [true, 'Handling time is required'],
      default: '00:00:00',
    },
    idleTime: {
      type: String,
      required: [true, 'Idle time is required'],
      default: '00:00:00',
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    totalProductionHr: {
      type: Number,
    },
    totalWorkingHrs: {
      type: String,
    },
    created: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.EmployeeForm ||
  mongoose.model<EmployeeFormDocument>('EmployeeForm', EmployeeFormSchema);
