import mongoose, { Schema, Document } from 'mongoose';
import { AdminEntry } from '../../types';

export interface AdminEntryDocument extends AdminEntry, Document {}

const AdminEntrySchema: Schema = new Schema(
  {
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
    dcno: {
      type: String,
      required: [true, 'DC number is required'],
      trim: true,
    },
    internalJobOrder: {
      type: String,
      trim: true,
      default: '',
    },
    machineName: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
    },
    operatorName: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
    },
    shift: {
      type: String,
      required: [true, 'Shift is required'],
      enum: ['Day', 'Night', 'General'],
    },
    additionalQty: {
      type: Number,
      default: 0,
      min: [0, 'Additional quantity cannot be negative'],
    },
    totalQty: {
      type: Number,
      required: true,
    },
    opn: {
      type: String,
      required: [true, 'OPN is required'],
      trim: true,
    },
    progNo: {
      type: String,
      required: [true, 'Program number is required'],
      trim: true,
    },
    settingTime: {
      type: Number,
      required: [true, 'Setting time is required'],
      min: [0, 'Setting time cannot be negative'],
    },
    cycleTime: {
      type: Number,
      required: [true, 'Cycle time is required'],
      min: [0, 'Cycle time cannot be negative'],
    },
    handlingTime: {
      type: Number,
      required: [true, 'Handling time is required'],
      min: [0, 'Handling time cannot be negative'],
    },
    idleTime: {
      type: Number,
      required: [true, 'Idle time is required'],
      min: [0, 'Idle time cannot be negative'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    totalProductionHr: {
      type: Number,
      required: true,
    },
    totalWorkingHr: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfEntry: {
      type: Date,
      required: [true, 'Date of entry is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total quantity and production hours before saving
AdminEntrySchema.pre<AdminEntryDocument>('save', function (next) {
  this.totalQty = this.qty + (this.additionalQty || 0);
  
  // Calculate production hours (difference between start and end time in hours)
  const timeDiff = this.endTime.getTime() - this.startTime.getTime();
  this.totalProductionHr = timeDiff / (1000 * 60 * 60); // Convert to hours
  
  // Calculate working hours (production time minus idle time)
  this.totalWorkingHr = this.totalProductionHr - (this.idleTime / 60); // Convert idle time from minutes to hours
  
  next();
});

export default mongoose.models.AdminEntry || mongoose.model<AdminEntryDocument>('AdminEntry', AdminEntrySchema);