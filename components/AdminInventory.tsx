'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomerList } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Package, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from 'lucide-react';

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

type SortKey =
  | 'customerName'
  | 'componentName'
  | 'qty'
  | 'dcno'
  | 'internalJobOrder'
  | 'supplierName'
  | 'materialGrade'
  | 'rawMaterialPricePerKg'
  | 'rawMaterialCost'
  | 'addedOn';

type SortDir = 'asc' | 'desc';

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

const getAddedAtTs = (entry: AdminInventoryEntry) => {
  const raw = entry.created ?? entry.createdAt;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

export default function AdminInventory() {
  const [entries, setEntries] = useState<AdminInventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('addedOn');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
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
    const base = !term
      ? [...entries]
      : entries.filter((entry) =>
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

    const dir = sortDir === 'asc' ? 1 : -1;

    base.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortKey) {
        case 'qty':
          aVal = Number(a.qty) || 0;
          bVal = Number(b.qty) || 0;
          break;
        case 'rawMaterialPricePerKg':
          aVal = Number(a.rawMaterialPricePerKg) || 0;
          bVal = Number(b.rawMaterialPricePerKg) || 0;
          break;
        case 'rawMaterialCost':
          aVal = Number(a.rawMaterialCost) || 0;
          bVal = Number(b.rawMaterialCost) || 0;
          break;
        case 'addedOn':
          aVal = getAddedAtTs(a);
          bVal = getAddedAtTs(b);
          break;
        default:
          aVal = String(a[sortKey] || '').toLowerCase();
          bVal = String(b[sortKey] || '').toLowerCase();
      }

      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

    return base;
  }, [entries, search, sortKey, sortDir]);

  const totalQty = useMemo(
    () => filtered.reduce((sum, entry) => sum + (Number(entry.qty) || 0), 0),
    [filtered]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'addedOn' || key === 'qty' || key === 'rawMaterialCost' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    );
  };

  const SortableHead = ({
    column,
    children,
    className,
  }: {
    column: SortKey;
    children: ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="inline-flex items-center font-medium hover:text-foreground"
      >
        {children}
        <SortIcon column={column} />
      </button>
    </TableHead>
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

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="customerName">Customer</SortableHead>
              <SortableHead column="componentName">Component</SortableHead>
              <SortableHead column="qty" className="text-right">
                Qty
              </SortableHead>
              <SortableHead column="dcno">DC No</SortableHead>
              <SortableHead column="internalJobOrder">Job Order</SortableHead>
              <SortableHead column="supplierName">Supplier</SortableHead>
              <SortableHead column="materialGrade">Grade</SortableHead>
              <SortableHead column="rawMaterialPricePerKg" className="text-right">
                Price/kg
              </SortableHead>
              <SortableHead column="rawMaterialCost" className="text-right">
                RM Cost
              </SortableHead>
              <SortableHead column="addedOn">Added on</SortableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  No admin entries found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, index) => (
                <TableRow
                  key={entry._id || `${entry.customerName}-${entry.componentName}-${index}`}
                  className={entry._id ? 'cursor-pointer hover:bg-muted/50' : undefined}
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
                  <TableCell className="text-right">
                    {entry._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/${entry._id}`);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
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
