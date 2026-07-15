'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import AdminEntryForm from '@/components/AdminEntryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AdminEntry } from '@/types';
import { getCustomerList } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function EditAdminEntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<AdminEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        // Load from adminEntryForm collection (same source as inventory)
        const data = await getCustomerList();
        const matched = Array.isArray(data)
          ? data.find((item: any) => String(item._id) === String(params.id))
          : null;

        if (!matched) {
          throw new Error('Admin entry not found');
        }

        setEntry(matched);
      } catch (error) {
        console.error('Error loading admin entry:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin entry data',
          variant: 'destructive',
        });
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [params.id, router, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="w-[250px] h-[40px] mb-6" />
        <div className="space-y-4">
          <Skeleton className="w-full h-[60px]" />
          <Skeleton className="w-full h-[60px]" />
          <Skeleton className="w-full h-[60px]" />
          <Skeleton className="w-full h-[60px]" />
          <Skeleton className="w-full h-[60px]" />
          <Skeleton className="w-[200px] h-[50px] mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Edit Admin Entry</h1>
      {entry && <AdminEntryForm initialData={entry} />}
    </div>
  );
}
