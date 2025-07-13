'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Factory,
  User,
  Package,
} from 'lucide-react';
import { AdminEntry } from '@/types';
import * as XLSX from 'xlsx';
import { getEmployeeData, formatDate } from '@/lib/utils';

export default function DataTable() {
  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  
  const fetchEntries = async () => {
    try {
      // Get current date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      // Fetch data from APIs - matches React Native exactly
      const employeeData = await getEmployeeData(formattedStartDate, formattedEndDate);

      // Process employee data to match AdminEntry interface
      const allEntries = employeeData.map((record: any) => ({
        _id: record._id,
        customerName: record.customerName || 'Unknown',
        componentName: record.componentName || 'Unknown',
        qty: record.qty || 0,
        dcno: record.dcno || '',
        internalJobOrder: record.internalJobOrder || '',
        machineName: record.machineName || 'Unknown',
        operatorName: record.operatorName || 'Unknown',
        shift: record.shift || 'Day',
        additionalQty: record.additionalQty || 0,
        totalQty: record.totalQty || record.qty || 0,
        opn: record.opn || '',
        progNo: record.progNo || '',
        settingTime: record.settingTime || 0,
        cycleTime: record.cycleTime || 0,
        handlingTime: record.handlingTime || 0,
        idleTime: record.idleTime || 0,
        startTime: new Date(record.startTime || record.dateOfEntry),
        endTime: new Date(record.endTime || record.dateOfEntry),
        totalProductionHr: record.totalProductionHr || 0,
        totalWorkingHr: record.totalWorkingHr || 0,
        remarks: record.remarks || '',
        dateOfEntry: new Date(record.dateOfEntry || record.date),
        createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
      }));

      setEntries(allEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEntries();
  }, []);
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
              const response = await fetch(`/api/admin/${deleteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }
      
      setEntries(entries.filter(entry => entry._id !== deleteId));
      
      toast({
        title: 'Success',
        description: 'Entry deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to delete entry',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };
  
  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredEntries.map(entry => ({
        'Customer Name': entry.customerName,
        'Component Name': entry.componentName,
        'Machine Name': entry.machineName,
        'Operator Name': entry.operatorName,
        'Shift': entry.shift,
        'Quantity': entry.qty,
        'Additional Qty': entry.additionalQty || 0,
        'Total Qty': entry.totalQty,
        'DC Number': entry.dcno,
        'Internal Job Order': entry.internalJobOrder || '',
        'OPN': entry.opn,
        'Program Number': entry.progNo,
        'Setting Time': entry.settingTime,
        'Cycle Time': entry.cycleTime,
        'Handling Time': entry.handlingTime,
        'Idle Time': entry.idleTime,
        'Total Production Hr': entry.totalProductionHr,
        'Total Working Hr': entry.totalWorkingHr,
        'Date of Entry': new Date(entry.dateOfEntry).toLocaleDateString(),
        'Remarks': entry.remarks || '',
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Entries');
    XLSX.writeFile(workbook, 'production_entries.xlsx');
  };
  
  const filteredEntries = searchQuery
    ? entries.filter(
        entry =>
          entry.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.dcno.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;
  
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Production Entries</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleExportToExcel} title="Export to Excel">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Link href="/data/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Entry</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>DC No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 9 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedEntries.length > 0 ? (
                  paginatedEntries.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {entry.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {entry.componentName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          {entry.machineName}
                        </div>
                      </TableCell>
                      <TableCell>{entry.operatorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.shift}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-semibold">{entry.totalQty}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.qty} + {entry.additionalQty || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.dcno}</TableCell>
                      <TableCell>
                        {new Date(entry.dateOfEntry).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/data/${entry._id}`}>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(entry._id || null)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entry from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}