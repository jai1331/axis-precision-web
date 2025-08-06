import mongoose from 'mongoose';

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
    created: { type: Date, default: Date.now() }
  },
  { collection: 'adminEntryForm' }
);

const AdminEntryForm = mongoose.model('adminEntryForm', adminEntrySchema);

export default AdminEntryForm; 