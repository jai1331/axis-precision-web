const mongoose = require('mongoose');

const adminEntrySchema = new mongoose.Schema(
	{
		customerName: { type: String, required: true },
		componentName: { type: String, required: true },
        qty: {  type: Number, required: true},
		dcno: {  type: String, required: true},
		internalJobOrder: { type: String, required: true },
		created: { type: Date, default: Date.now() }
	},
	{ collection: 'adminEntryForm' }
)

const model = mongoose.model('adminEntryForm', adminEntrySchema)

module.exports = model;
