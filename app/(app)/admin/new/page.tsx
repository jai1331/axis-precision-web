'use client';

import AdminEntryForm from '@/components/AdminEntryForm';

export default function NewAdminEntryPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Add New Admin Entry</h1>
      <AdminEntryForm />
    </div>
  );
}