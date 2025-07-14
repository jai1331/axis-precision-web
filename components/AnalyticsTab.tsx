'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  X,
  Factory,
  User,
  Package,
  Clock,
  TrendingUp,
  MoreVertical,
  Save,
  RotateCcw,
  Download,
} from 'lucide-react';
import { ProductionRecord, ProductionFilters } from '@/types';
import ProductionRecordModal from './ProductionRecordModal';
import { addTimes, getEmployeeData, formatDate } from '@/lib/utils';
import moment from 'moment';
import * as XLSX from 'xlsx';



interface AnalyticsTabProps {
  productionData?: any[];
  loading?: boolean;
  dashboardData?: any;
}

export default function AnalyticsTab({ productionData = [], loading: externalLoading = false, dashboardData }: AnalyticsTabProps) {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState<any>({});
  const { toast } = useToast();

  const itemsPerPage = 12;

  const [filters, setFilters] = useState<ProductionFilters>({
    search: '',
    sortBy: 'dateOfEntry',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
  });

  const [savedFilters, setSavedFilters] = useState<ProductionFilters>({
    search: '',
    sortBy: 'dateOfEntry',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
  });

  const [tempFilters, setTempFilters] = useState<ProductionFilters>({
    search: '',
    sortBy: 'dateOfEntry',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    console.log('AnalyticsTab received productionData:', productionData);
    console.log('AnalyticsTab externalLoading:', externalLoading);
    
    if (productionData && productionData.length > 0) {
      console.log('Processing production data, length:', productionData.length);
      // Process production data to match ProductionRecord interface
      const allRecords = productionData.map((record: any) => ({
        _id: record._id || record.id,
        componentName: record.componentName || 'Unknown',
        customerName: record.customerName || 'Unknown',
        machineName: record.machineName || record.machine || 'Unknown',
        operatorName: record.operatorName || 'Unknown',
        shift: record.shift || 'Day',
        qty: record.qty || 0,
        additionalQty: record.additionalQty || 0,
        totalQty: record.totalQty || record.qty || 0,
        opn: record.opn || '',
        progNo: record.progNo || '',
        settingTime: record.settingTime || 0,
        cycleTime: record.cycleTime || 0,
        handlingTime: record.handlingTime || 0,
        idleTime: record.idleTime || 0,
        startTime: record.startTime,
        endTime: record.endTime,
        totalProductionHr: record.totalProductionHr || 0,
        totalWorkingHr: record.totalWorkingHrs || 0,
        remarks: record.remarks || '',
        dateOfEntry: new Date(record.dateOfEntry || record.date),
        createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
      }));

      console.log('Processed records:', allRecords.slice(0, 3));
      setRecords(allRecords);
      setTotalRecords(allRecords.length);
      setTotalPages(Math.ceil(allRecords.length / itemsPerPage));
      setLoading(false);
    } else if (externalLoading) {
      console.log('External loading is true');
      setLoading(true);
    } else {
      console.log('No production data and not loading');
      setLoading(false);
    }
  }, [productionData, externalLoading]);

  useEffect(() => {
    applyFilters();
  }, [records, filters, dashboardData]);

  const applyFilters = () => {
    let filtered = [...records];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(record =>
        record.componentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.machineName.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.operatorName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(record => new Date(record.dateOfEntry) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(record => new Date(record.dateOfEntry) <= endDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'componentName':
          aValue = a.componentName;
          bValue = b.componentName;
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'machineName':
          aValue = a.machineName;
          bValue = b.machineName;
          break;
        case 'dateOfEntry':
        default:
          aValue = new Date(a.dateOfEntry);
          bValue = new Date(b.dateOfEntry);
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecords(filtered);
    setTotalRecords(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);

    // Calculate summary data
    calculateSummaryData(filtered);
  };

  const calculateSummaryData = (data: ProductionRecord[]) => {
    // Use dashboard data if available, otherwise calculate from records
    if (dashboardData) {
      console.log('Using dashboard data for summary:', dashboardData);
      setSummaryData({
        tc1: dashboardData.tc1ProdTime || '0:00',
        tc2: dashboardData.tc2ProdTime || '0:00',
        vmc: dashboardData.vmcProdTime || '0:00',
        tc3: dashboardData.tc3ProdTime || '0:00',
        totalProductionHr: dashboardData.productionHrs || '0:00',
        totalIdleHr: dashboardData.idleHrs || '0:00',
        totalWorkingHr: dashboardData.workingHrs || '0:00',
      });
      return;
    }

    if (!data.length) {
      setSummaryData({
        tc1: '0:00',
        tc2: '0:00',
        vmc: '0:00',
        tc3: '0:00',
        totalProductionHr: '0:00',
        totalIdleHr: '0:00',
        totalWorkingHr: '0:00',
      });
      return;
    }

    // Group by machine
    const tc1Records = data.filter(record => record.machineName === 'TC-1');
    const tc2Records = data.filter(record => record.machineName === 'TC-2');
    const vmcRecords = data.filter(record => record.machineName === 'VMC');
    const tc3Records = data.filter(record => record.machineName === 'TC-3');

    // Calculate totals for each machine
    const tc1Total = tc1Records.reduce((sum, record) => sum + record.totalProductionHr, 0);
    const tc2Total = tc2Records.reduce((sum, record) => sum + record.totalProductionHr, 0);
    const vmcTotal = vmcRecords.reduce((sum, record) => sum + record.totalProductionHr, 0);
    const tc3Total = tc3Records.reduce((sum, record) => sum + record.totalProductionHr, 0);

    const totalProduction = tc1Total + tc2Total + vmcTotal + tc3Total;
    const totalIdle = data.reduce((sum, record) => sum + (record.idleTime / 60), 0); // Convert minutes to hours
    const totalWorking = data.reduce((sum, record) => sum + record.totalWorkingHr, 0);

    const formatHours = (hours: number) => {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h}:${m.toString().padStart(2, '0')}`;
    };

    setSummaryData({
      tc1: formatHours(tc1Total),
      tc2: formatHours(tc2Total),
      vmc: formatHours(vmcTotal),
      tc3: formatHours(tc3Total),
      totalProductionHr: formatHours(totalProduction),
      totalIdleHr: formatHours(totalIdle),
      totalWorkingHr: formatHours(totalWorking),
    });
  };

  const handleTempFilterChange = (key: keyof ProductionFilters, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortToggle = () => {
    setTempFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const saveFilters = () => {
    setFilters(tempFilters);
    setSavedFilters(tempFilters);
    toast({
      title: 'Success',
      description: 'Filters applied successfully',
    });
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      sortBy: 'dateOfEntry' as const,
      sortOrder: 'desc' as const,
      startDate: '',
      endDate: '',
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setSavedFilters(defaultFilters);
    toast({
      title: 'Success',
      description: 'Filters reset successfully',
    });
  };

  const handleRecordClick = (record: ProductionRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleRecordUpdate = (updatedRecord: ProductionRecord) => {
    setRecords((prev) =>
      prev.map((record) =>
        record._id === updatedRecord._id ? updatedRecord : record
      )
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredRecords.map(record => ({
        'Component Name': record.componentName,
        'Customer Name': record.customerName,
        'Machine Name': record.machineName,
        'Operator Name': record.operatorName,
        'Shift': record.shift,
        'Quantity': record.qty,
        'Additional Qty': record.additionalQty,
        'Total Qty': record.totalQty,
        'OPN': record.opn,
        'Program No': record.progNo,
        'Setting Time (min)': record.settingTime,
        'Cycle Time (min)': record.cycleTime,
        'Handling Time (min)': record.handlingTime,
        'Idle Time (min)': record.idleTime,
        'Start Time': new Date(record.startTime).toLocaleString(),
        'End Time': new Date(record.endTime).toLocaleString(),
        'Total Production Hr': record.totalProductionHr,
        'Total Working Hr': record.totalWorkingHr,
        'Date of Entry': new Date(record.dateOfEntry).toLocaleDateString(),
        'Remarks': record.remarks || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Records');
      XLSX.writeFile(workbook, 'production_records.xlsx');
      
      toast({
        title: 'Success',
        description: 'Excel file downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download Excel file',
        variant: 'destructive',
      });
    }
  };

  const hasActiveFilters = tempFilters.search || tempFilters.startDate || tempFilters.endDate;
  const hasUnsavedChanges = JSON.stringify(tempFilters) !== JSON.stringify(savedFilters);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '0hr 0min';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return `${hours}hr ${minutes}min`;
  };

  // Get paginated records
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TC1 Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(summaryData.tc1)}</div>
            <p className="text-xs text-muted-foreground">Machine hours</p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TC2 Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(summaryData.tc2)}</div>
            <p className="text-xs text-muted-foreground">Machine hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VMC Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(summaryData.vmc)}</div>
            <p className="text-xs text-muted-foreground">Machine hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TC3 Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(summaryData.tc3)}</div>
            <p className="text-xs text-muted-foreground">Machine hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by component, customer, or machine..."
                className="pl-10"
                value={tempFilters.search}
                onChange={(e) => handleTempFilterChange('search', e.target.value)}
              />
            </div>

            {/* Sort By */}
            <Select
              value={tempFilters.sortBy}
              onValueChange={(value) => handleTempFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="componentName">Component Name</SelectItem>
                <SelectItem value="customerName">Customer Name</SelectItem>
                <SelectItem value="machineName">Machine Name</SelectItem>
                <SelectItem value="dateOfEntry">Date of Entry</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={handleSortToggle}
              className="justify-start"
            >
              {tempFilters.sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              {tempFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Start date"
                className="pl-10"
                value={tempFilters.startDate}
                onChange={(e) => handleTempFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="End date"
                className="pl-10"
                value={tempFilters.endDate}
                onChange={(e) => handleTempFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                  {hasUnsavedChanges
                    ? 'Unsaved filter changes'
                    : `Showing ${totalRecords} filtered results`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={saveFilters}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Records */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Production Records</h3>
            <p className="text-muted-foreground">
              Monitor production entries and performance
            </p>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing {paginatedRecords.length} of {totalRecords} records
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </p>
            )}
          </div>
        </div>

        {/* Production Records Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedRecords.map((record) => (
              <Card
                key={record._id}
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                onClick={() => handleRecordClick(record)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">
                        {record.componentName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.dateOfEntry).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{record.customerName}</span>
                  </div>

                  {/* Machine Info */}
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{record.machineName}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {record.shift}
                    </Badge>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Quantity</span>
                    </div>
                    <span className="text-sm font-bold">{record.totalQty}</span>
                  </div>

                  {/* Status and Operator */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Operator</span>
                      <span className="text-xs font-medium">{record.operatorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">OPN</span>
                      <span className="text-xs font-medium">{record.opn}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
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
                        onClick={() => handlePageChange(pageNumber)}
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
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductionRecordModal
        record={selectedRecord}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        onUpdate={handleRecordUpdate}
      />
    </div>
  );
}