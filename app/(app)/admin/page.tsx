'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminEntryForm from '@/components/AdminEntryForm';
import AdminInventory from '@/components/AdminInventory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') === 'entry' ? 'entry' : 'inventory';

  const handleTabChange = (value: string) => {
    const next = value === 'entry' ? '/admin?tab=entry' : '/admin';
    router.replace(next);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="entry">New Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <AdminInventory />
        </TabsContent>

        <TabsContent value="entry">
          <h2 className="text-xl font-semibold mb-4">Add New Admin Entry</h2>
          <AdminEntryForm />
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
