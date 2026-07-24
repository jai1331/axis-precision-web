'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ClipboardList, Pencil } from 'lucide-react';

type EmployeeEntry = {
  _id?: string;
  operatorName?: string;
  date?: string | Date;
  shift?: string;
  machine?: string;
  customerName?: string;
  componentName?: string;
  qty?: number;
  additionalQty?: number;
  opn?: string;
  progNo?: string;
  internalJobOrder?: string;
  settingTime?: string;
  cycleTime?: string;
  handlingTime?: string;
  idleTime?: string;
  startTime?: string;
  endTime?: string;
  remarks?: string;
  totalProductionHr?: string;
  totalWorkingHrs?: string;
  createdAt?: string | Date;
};

const formatDate = (value?: string | Date) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

interface EmployeeEntriesListProps {
  /** When true, show Edit actions and open admin edit page */
  editable?: boolean;
}

export default function EmployeeEntriesList({ editable = false }: EmployeeEntriesListProps) {
  const [entries, setEntries] = useState<EmployeeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/employeeForm');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        list.sort((a: EmployeeEntry, b: EmployeeEntry) => {
          const aTs = new Date(a.date || a.createdAt || 0).getTime();
          const bTs = new Date(b.date || b.createdAt || 0).getTime();
          return bTs - aTs;
        });
        setEntries(list);
      } catch (error) {
        console.error('Error fetching employee entries:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee entries',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [toast]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) =>
      [
        entry.operatorName,
        entry.customerName,
        entry.componentName,
        entry.machine,
        entry.shift,
        entry.opn,
        entry.progNo,
        entry.internalJobOrder,
        entry.remarks,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [entries, search]);

  const openEdit = (id?: string) => {
    if (!id) return;
    router.push(`/admin/employee/${id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const colSpan = editable ? 21 : 20;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Saved entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filtered.length}</div>
          <p className="text-xs text-muted-foreground">Employee production records</p>
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search operator, customer, component, machine…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Addl Qty</TableHead>
              <TableHead>OPN</TableHead>
              <TableHead>Prog No</TableHead>
              <TableHead>Job Order</TableHead>
              <TableHead>Setting</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Handling</TableHead>
              <TableHead>Idle</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Prod Hr</TableHead>
              <TableHead>Work Hr</TableHead>
              <TableHead>Remarks</TableHead>
              {editable && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                  No employee entries found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, index) => (
                <TableRow
                  key={entry._id || `entry-${index}`}
                  className={editable && entry._id ? 'cursor-pointer hover:bg-muted/50' : undefined}
                  onClick={() => {
                    if (editable && entry._id) openEdit(entry._id);
                  }}
                >
                  <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                  <TableCell className="font-medium">{entry.operatorName || '—'}</TableCell>
                  <TableCell>{entry.customerName || '—'}</TableCell>
                  <TableCell>{entry.componentName || '—'}</TableCell>
                  <TableCell>{entry.machine || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.shift || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{entry.qty ?? 0}</TableCell>
                  <TableCell className="text-right">{entry.additionalQty ?? 0}</TableCell>
                  <TableCell>{entry.opn || '—'}</TableCell>
                  <TableCell>{entry.progNo || '—'}</TableCell>
                  <TableCell>{entry.internalJobOrder || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.settingTime || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.cycleTime || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.handlingTime || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.idleTime || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.startTime || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.endTime || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.totalProductionHr || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{entry.totalWorkingHrs || '—'}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{entry.remarks || '—'}</TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      {entry._id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(entry._id);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
