'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import EmployeeEntryForm from '@/components/EmployeeEntryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditEmployeeEntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/employeeForm?id=${encodeURIComponent(params.id)}`);
        if (!response.ok) {
          throw new Error('Employee entry not found');
        }
        const data = await response.json();
        if (!data || data.error) {
          throw new Error(data?.error || 'Employee entry not found');
        }
        setEntry(data);
      } catch (error) {
        console.error('Error loading employee entry:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee entry data',
          variant: 'destructive',
        });
        router.push('/admin?tab=employees');
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
          onClick={() => router.push('/admin?tab=employees')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employee Entries
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Edit Employee Entry</h1>
      {entry && (
        <EmployeeEntryForm
          initialData={entry}
          adminEdit
          onUpdateSuccess={() => router.push('/admin?tab=employees')}
        />
      )}
    </div>
  );
}
