'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import AdminEntryForm from '@/components/AdminEntryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminEntry } from '@/types';

export default function EditAdminEntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<AdminEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchEntry = async () => {
      try {
                // Use proxy in development, production API in production
      const response = await fetch(`/api/admin/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch admin entry');
        }
        const data = await response.json();
        setEntry(data);
      } catch (error) {
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
      <h1 className="text-3xl font-bold mb-6">Edit Admin Entry</h1>
      {entry && <AdminEntryForm initialData={entry} />}
    </div>
  );
}