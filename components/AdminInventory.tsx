'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomerList } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Package } from 'lucide-react';

type AdminInventoryEntry = {
  _id?: string;
  customerName?: string;
  componentName?: string;
  qty?: number;
  dcno?: string;
  internalJobOrder?: string;
  supplierName?: string;
  rawMaterialPricePerKg?: number;
  materialGrade?: string;
  rawMaterialCost?: number;
  created?: string | Date;
  createdAt?: string | Date;
};

const formatAddedAt = (entry: AdminInventoryEntry) => {
  const raw = entry.created ?? entry.createdAt;
  if (!raw) return '—';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminInventory() {
  const [entries, setEntries] = useState<AdminInventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const data = await getCustomerList();
        setEntries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching admin entries:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin inventory',
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
        entry.customerName,
        entry.componentName,
        entry.supplierName,
        entry.dcno,
        entry.internalJobOrder,
        entry.materialGrade,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [entries, search]);

  const totalQty = useMemo(
    () => filtered.reduce((sum, entry) => sum + (Number(entry.qty) || 0), 0),
    [filtered]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
            <p className="text-xs text-muted-foreground">Saved admin entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total qty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQty.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across filtered inventory</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search customer, component, supplier, DC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Component</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>DC No</TableHead>
              <TableHead>Job Order</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Price/kg</TableHead>
              <TableHead className="text-right">RM Cost</TableHead>
              <TableHead>Added on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No admin entries found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, index) => (
                <TableRow
                  key={entry._id || `${entry.customerName}-${entry.componentName}-${index}`}
                  className={entry._id ? 'cursor-pointer' : undefined}
                  onClick={() => {
                    if (entry._id) router.push(`/admin/${entry._id}`);
                  }}
                >
                  <TableCell className="font-medium">{entry.customerName || '—'}</TableCell>
                  <TableCell>{entry.componentName || '—'}</TableCell>
                  <TableCell className="text-right">{(entry.qty ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{entry.dcno || '—'}</TableCell>
                  <TableCell>{entry.internalJobOrder || '—'}</TableCell>
                  <TableCell>{entry.supplierName || '—'}</TableCell>
                  <TableCell>{entry.materialGrade || '—'}</TableCell>
                  <TableCell className="text-right">
                    ₹{Number(entry.rawMaterialPricePerKg || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(entry.rawMaterialCost || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatAddedAt(entry)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
