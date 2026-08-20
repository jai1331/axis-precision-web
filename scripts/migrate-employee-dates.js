/**
 * One-time migration: convert employeeForm.date from string → BSON Date.
 * Run: node scripts/migrate-employee-dates.js
 */
const mongoose = require('mongoose');

const mongoUri =
  'mongodb+srv://admin:IronMan@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const coll = db.collection('employeeForm');

  const before = await coll
    .aggregate([{ $group: { _id: { $type: '$date' }, count: { $sum: 1 } } }])
    .toArray();
  console.log('Before migration:', before);

  const stringCount = before.find((b) => b._id === 'string')?.count ?? 0;
  if (stringCount === 0) {
    console.log('No string dates to migrate.');
    await mongoose.disconnect();
    return;
  }

  const result = await coll.updateMany({ date: { $type: 'string' } }, [
    { $set: { date: { $toDate: '$date' } } },
  ]);

  const after = await coll
    .aggregate([{ $group: { _id: { $type: '$date' }, count: { $sum: 1 } } }])
    .toArray();
  console.log('Migrated:', result.modifiedCount, 'records');
  console.log('After migration:', after);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
