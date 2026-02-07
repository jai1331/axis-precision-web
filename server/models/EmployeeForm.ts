/**
 * Re-exports the SINGLE EmployeeForm model from model/employeeForm.js.
 * Do NOT define a schema here — the only schema is in model/employeeForm.js.
 * This avoids duplicate Mongoose models and ensures internalJobOrder (and all fields) are saved.
 */
import type { Document, Model } from 'mongoose';
import type { EmployeeForm } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const employeeFormModel = require('../../model/employeeForm') as Model<Document & EmployeeForm>;

export interface EmployeeFormDocument extends Document, EmployeeForm {}

export default employeeFormModel;
