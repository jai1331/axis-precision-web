/**
 * One-time fix: correct FONDELLO SPEC SP021S_02 → FONDELLO SPEC SP02107_02
 * in employeeForm records only (admin entry already has the correct name).
 */
const mongoose = require('mongoose');

const WRONG_COMPONENT = 'FONDELLO SPEC SP021S_02';
const CORRECT_COMPONENT = 'FONDELLO SPEC SP02107_02';

const mongoUri =
  'mongodb+srv://admin:IronMan@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority&appName=Cluster0';

const employeeFormSchema = new mongoose.Schema(
  {},
  { collection: 'employeeForm', strict: false }
);

async function main() {
  await mongoose.connect(mongoUri);
  const EmployeeForm = mongoose.model('employeeForm', employeeFormSchema);

  const preview = await EmployeeForm.find({ componentName: WRONG_COMPONENT }).lean();
  console.log(`Found ${preview.length} employee record(s) with wrong component "${WRONG_COMPONENT}"`);

  if (preview.length === 0) {
    console.log('Nothing to update.');
    await mongoose.disconnect();
    return;
  }

  preview.forEach((row, i) => {
    console.log(
      `  [${i + 1}] customer=${row.customerName}, jobOrder=${row.internalJobOrder}, date=${row.date}`
    );
  });

  const result = await EmployeeForm.updateMany(
    { componentName: WRONG_COMPONENT },
    { $set: { componentName: CORRECT_COMPONENT } }
  );

  console.log(`Updated ${result.modifiedCount} employee record(s) to "${CORRECT_COMPONENT}"`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
