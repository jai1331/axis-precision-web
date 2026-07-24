'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Factory, Loader2, Plus } from 'lucide-react';
import { DEFAULT_MACHINES, fetchMachines, normalizeMachineName } from '@/lib/machines';

export default function AdminMachines() {
  const [machines, setMachines] = useState<string[]>([...DEFAULT_MACHINES]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMachine, setNewMachine] = useState('');
  const { toast } = useToast();

  const loadMachines = async () => {
    setLoading(true);
    try {
      const list = await fetchMachines();
      setMachines(list);
    } catch (error) {
      console.error('Failed to load machines:', error);
      toast({
        title: 'Error',
        description: 'Failed to load machines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, []);

  const sorted = useMemo(
    () => [...machines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [machines]
  );

  const handleAdd = async () => {
    const name = normalizeMachineName(newMachine);
    if (!name) {
      toast({
        title: 'Validation Error',
        description: 'Machine name is required',
        variant: 'destructive',
      });
      return;
    }
    if (name.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Machine name must be at least 2 characters',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (!response.ok || data.status !== 'ok') {
        throw new Error(data.error || 'Failed to add machine');
      }

      toast({
        title: 'Success',
        description: `Machine "${data.response?.name || name}" added. It is now available in employee entry and dashboard.`,
      });
      setNewMachine('');
      await loadMachines();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add machine',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Machines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sorted.length}</div>
          <p className="text-xs text-muted-foreground">
            Available for employee entries, analytics, and dashboard
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Machine</CardTitle>
          <p className="text-sm text-muted-foreground">
            New machines are saved to the machines collection and appear in employee forms immediately.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <Input
              className="h-11"
              placeholder="e.g. VMC-3 or TC-4"
              value={newMachine}
              onChange={(e) => setNewMachine(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="bg-[#84c225] hover:bg-[#6fa01c] gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Machine
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((machine) => (
              <TableRow key={machine}>
                <TableCell className="font-medium">{machine}</TableCell>
                <TableCell>
                  <Badge variant="outline">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
