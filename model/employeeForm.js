const mongoose = require('mongoose');

const employeeFormSchema = new mongoose.Schema(
	{
        operatorName: { type: String, required: true },
        date: { type: String, required: true },
        shift: { type: String, required: true },
        machine: { type: String, required: true },
        customerName: { type: String, required: true },
        componentName: { type: String, required: true },
        qty: { type: Number, required: true},
        additionalQty: { type: Number, default: 0},
        opn: {  type: String, required: true},
        progNo: {  type: String, required: true},
        settingTime: { type: String },
        cycleTime: { type: String, required: true },
        handlingTime: { type: String, required: true },
        idleTime: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        remarks: { type: String },
        created: { type: Date, default: Date.now() },
        internalJobOrder: { type: String, required: true },
	},
	{ collection: 'employeeForm' }
)

const model = mongoose.model('employeeForm', employeeFormSchema)

module.exports = model;
