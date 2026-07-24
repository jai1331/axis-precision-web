'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminEntryForm from '@/components/AdminEntryForm';
import AdminInventory from '@/components/AdminInventory';
import AdminMachines from '@/components/AdminMachines';
import EmployeeEntriesList from '@/components/EmployeeEntriesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const tab =
    tabParam === 'entry'
      ? 'entry'
      : tabParam === 'employees'
        ? 'employees'
        : tabParam === 'machines'
          ? 'machines'
          : 'inventory';

  const handleTabChange = (value: string) => {
    if (value === 'entry') router.replace('/admin?tab=entry');
    else if (value === 'employees') router.replace('/admin?tab=employees');
    else if (value === 'machines') router.replace('/admin?tab=machines');
    else router.replace('/admin');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="employees">Employee Entries</TabsTrigger>
          <TabsTrigger value="entry">New Admin Entry</TabsTrigger>
          <TabsTrigger value="machines">Add New Machine</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <AdminInventory />
        </TabsContent>

        <TabsContent value="employees">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Employee Production Entries</h2>
            <p className="text-sm text-muted-foreground">
              View and correct employee records. Updates save to the employeeForm collection.
            </p>
          </div>
          <EmployeeEntriesList editable />
        </TabsContent>

        <TabsContent value="entry">
          <h2 className="text-xl font-semibold mb-4">Add New Admin Entry</h2>
          <AdminEntryForm />
        </TabsContent>

        <TabsContent value="machines">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Machines</h2>
            <p className="text-sm text-muted-foreground">
              Manage machines available for employee production entries and dashboard summaries.
            </p>
          </div>
          <AdminMachines />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
