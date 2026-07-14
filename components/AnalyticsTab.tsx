'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
import { addTimes, getEmployeeData, formatDate, getCustomerList } from '@/lib/utils';
import moment from 'moment';
import * as XLSX from 'xlsx';

interface AnalyticsTabProps {
  productionData?: any[];
  loading?: boolean;
  dashboardData?: any;
}

const timeStringToHours = (time: string): number => {
  if (time == null || time === '') return 0;
  const str = String(time).trim();
  if (!str) return 0;
  const parts = str.split(':').map((x) => parseInt(x, 10) || 0);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;
  return hours + minutes / 60 + seconds / 3600;
};

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
  const [adminEntries, setAdminEntries] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    customers: [] as string[],
    suppliers: [] as string[],
    jobOrders: [] as string[],
    materialGrades: [] as string[],
    opns: [] as string[], // Add opns here
  });
  const [tcPricePerHr, setTcPricePerHr] = useState<string>('250');
  const [vmcPricePerHr, setVmcPricePerHr] = useState<string>('450');
  const { toast } = useToast();

  const itemsPerPage = 12;

  const [filters, setFilters] = useState<ProductionFilters>({
    search: '',
    sortBy: 'dateOfEntry',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
    internalJobOrder: 'all',
    customerName: 'all',
    supplierName: 'all',
    materialGrade: 'all',
    rawMaterialPricePerKgMin: '',
    rawMaterialPricePerKgMax: '',
    rawMaterialCostMin: '',
    rawMaterialCostMax: '',
    opn: ['all'],
  });

  const [savedFilters, setSavedFilters] = useState<ProductionFilters>({
    search: '',
    sortBy: 'dateOfEntry',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
    internalJobOrder: 'all',
    customerName: 'all',
    supplierName: 'all',
    materialGrade: 'all',
    rawMaterialPricePerKgMin: '',
    rawMaterialPricePerKgMax: '',
    rawMaterialCostMin: '',
    rawMaterialCostMax: '',
    opn: ['all'],
  });

  const [tempFilters, setTempFilters] = useState<ProductionFilters>({
    search: '',
    sortBy: 'dateOfEntry',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
    internalJobOrder: 'all',
    customerName: 'all',
    supplierName: 'all',
    materialGrade: 'all',
    rawMaterialPricePerKgMin: '',
    rawMaterialPricePerKgMax: '',
    rawMaterialCostMin: '',
    rawMaterialCostMax: '',
    opn: ['all'],
  });

  // Add this state to track filter application
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  useEffect(() => {
    fetchAdminEntries();
  }, []);

  const fetchAdminEntries = async () => {
    try {
      const data = await getCustomerList();
      console.log('Fetched admin entries:', data);
      setAdminEntries(data);
    } catch (error) {
      console.error('Error fetching admin entries:', error);
    }
  };

  useEffect(() => {
    console.log('AnalyticsTab received productionData:', productionData);
    console.log('AnalyticsTab externalLoading:', externalLoading);

    if(adminEntries.length === 0) { return; }

    if (productionData && productionData.length > 0) {
      console.log('Processing production data, length:', productionData.length);

      // Process production data to match ProductionRecord interface
      const allRecords = productionData.map((record: any) => {
        // Find matching admin entry for additional data
        const adminEntry = adminEntries.find((admin: any) =>
          (admin.customerName === record.customerName &&
          admin.componentName === record.componentName) &&
          (admin.internalJobOrder === record.internalJobOrder || !record.internalJobOrder) // Match job order if available, otherwise ignore
        );

        return {
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
          supplierName: adminEntry?.supplierName || 'Unknown',
          rawMaterialPricePerKg: adminEntry?.rawMaterialPricePerKg || 0,
          materialGrade: adminEntry?.materialGrade || 'Unknown',
          rawMaterialCost: adminEntry?.rawMaterialCost || 0,
          internalJobOrder: adminEntry?.internalJobOrder || record.internalJobOrder || '',
        };
      });

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
  }, [productionData, adminEntries]);

  useEffect(() => {
    if (!isApplyingFilters && records.length > 0) {
      applyFilters();
    }
  }, [records, filters]); // Remove dashboardData dependency

  // Extract filter options from records
  useEffect(() => {
    if (records.length > 0) {
      const uniqueJobOrders = [...new Set(
        records
          .map(record => record.internalJobOrder)
          .filter(jobOrder => jobOrder && jobOrder.trim() !== '')
      )].sort();
  
      const uniqueCustomers = [...new Set(records.map(record => record.customerName))].sort();
      const uniqueSuppliers = [...new Set(records.map(record => record.supplierName))].sort();
      const uniqueMaterialGrades = [...new Set(records.map(record => record.materialGrade))].sort();
      const uniqueOpns = [...new Set(records.map(record => record.opn))].sort(); // Extract unique opns
  
      setFilterOptions({
        customers: uniqueCustomers,
        suppliers: uniqueSuppliers,
        jobOrders: uniqueJobOrders.filter((jobOrder): jobOrder is string => jobOrder !== undefined),
        materialGrades: uniqueMaterialGrades,
        opns: uniqueOpns, // Set unique opns
      });
    }
  }, [records]);

  // Update the applyFilters function
  const applyFilters = () => {
    // Prevent double execution
    if (isApplyingFilters) {
      console.log('Filter application already in progress, skipping...');
      return;
    }
  
    setIsApplyingFilters(true);
    console.log('=== Starting Filter Application ===');
    console.log('Current filters:', filters);
    console.log('Total records before filtering:', records.length);
  
    let filtered = [...records];
  
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.componentName.toLowerCase().includes(searchTerm) ||
          record.customerName.toLowerCase().includes(searchTerm) ||
          record.machineName.toLowerCase().includes(searchTerm)
      );
    }
  
    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter((record) => {
        const entryDate = new Date(record.dateOfEntry);
        return entryDate >= startDate;
      });
    }
  
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter((record) => {
        const entryDate = new Date(record.dateOfEntry);
        return entryDate <= endDate;
      });
    }
  
    // Apply internal job order filter
    if (filters.internalJobOrder && filters.internalJobOrder !== 'all') {
      filtered = filtered.filter(
        (record) => record.internalJobOrder === filters.internalJobOrder
      );
    }
  
    // Apply opn filter (multi-select; 'all' means no filter)
    const selectedOpns = Array.isArray(filters.opn) ? filters.opn : [filters.opn];
    const isAllOpns = selectedOpns.length === 0 || selectedOpns.includes('all');
    if (!isAllOpns) {
      filtered = filtered.filter((record) => selectedOpns.includes(record.opn));
    }
  
    // Update filtered records
    setFilteredRecords(filtered);
    setTotalRecords(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  
    // Calculate summary data
    calculateSummaryData(filtered);
  
    console.log('=== Filter Application Complete ===');
    console.log('Final filtered records count:', filtered.length);
  
    setIsApplyingFilters(false);
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
      if(!data.length) return;
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
    const tc1Total = tc1Records.reduce((sum, record) => sum + timeStringToHours(String(record.totalProductionHr)), 0);
    const tc2Total = tc2Records.reduce((sum, record) => sum + timeStringToHours(String(record.totalProductionHr)), 0);
    const vmcTotal = vmcRecords.reduce((sum, record) => sum + timeStringToHours(String(record.totalProductionHr)), 0);
    const tc3Total = tc3Records.reduce((sum, record) => sum + timeStringToHours(String(record.totalProductionHr)), 0);
  
    const totalProduction = tc1Total + tc2Total + vmcTotal + tc3Total;
    const totalIdle = data.reduce((sum, record) => sum + timeStringToHours(String(record.idleTime)), 0);
    const totalWorking = data.reduce((sum, record) => sum + timeStringToHours(String(record.totalWorkingHr)), 0);
  
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

  const tcPrice = parseFloat(tcPricePerHr) || 250;
  const vmcPrice = parseFloat(vmcPricePerHr) || 450;

  const machineCostSummary = useMemo(() => {
    const empty = {
      tc1: 0, tc2: 0, tc3: 0, vmc: 0,
      tc1Total: 0, tc2Total: 0, tc3Total: 0, vmcTotal: 0,
      rawMaterialCost: 0,
      tc1Qty: 0, tc2Qty: 0, tc3Qty: 0, vmcQty: 0,
      tc1Hrs: 0, tc2Hrs: 0, tc3Hrs: 0, vmcHrs: 0,
      usedAdminQty: false,
    };
    const data = filteredRecords;
    if (!data.length) return empty;

    // Match admin entry by applied filter supplierName / componentName / opn (from filtered records)
    const matchedAdmin = adminEntries.find((admin: any) => {
      const supplierOk =
        filters.supplierName === 'all' || admin.supplierName === filters.supplierName;
      if (!supplierOk) return false;

      return data.some((r) => {
        const componentOk = admin.componentName === r.componentName;
        const supplierRecordOk =
          filters.supplierName === 'all'
            ? admin.supplierName === r.supplierName || r.supplierName === 'Unknown'
            : admin.supplierName === filters.supplierName;
        const opnOk = (() => {
          const selectedOpns = Array.isArray(filters.opn) ? filters.opn : [filters.opn];
          const isAllOpns = selectedOpns.length === 0 || selectedOpns.includes('all');
          if (isAllOpns) return !admin.opn || admin.opn === r.opn;
          const recordOpnOk = selectedOpns.includes(r.opn);
          const adminOpnOk = !admin.opn || selectedOpns.includes(admin.opn);
          return recordOpnOk && adminOpnOk;
        })();
        return componentOk && supplierRecordOk && opnOk;
      });
    });

    const adminQty =
      matchedAdmin?.qty != null && Number(matchedAdmin.qty) > 0
        ? Number(matchedAdmin.qty)
        : null;
    const rawMaterialCost =
      matchedAdmin?.rawMaterialCost != null
        ? Number(matchedAdmin.rawMaterialCost) || 0
        : (data.find((r) => (r.rawMaterialCost ?? 0) > 0)?.rawMaterialCost ?? 0);

    const tc1R = data.filter((r) => r.machineName === 'TC-1');
    const tc2R = data.filter((r) => r.machineName === 'TC-2');
    const tc3R = data.filter((r) => r.machineName === 'TC-3');
    const vmcR = data.filter((r) => r.machineName === 'VMC');
    const tc1Hrs = tc1R.reduce((s, r) => s + timeStringToHours(String(r.totalProductionHr)), 0);
    const tc2Hrs = tc2R.reduce((s, r) => s + timeStringToHours(String(r.totalProductionHr)), 0);
    const tc3Hrs = tc3R.reduce((s, r) => s + timeStringToHours(String(r.totalProductionHr)), 0);
    const vmcHrs = vmcR.reduce((s, r) => s + timeStringToHours(String(r.totalProductionHr)), 0);

    const recordTc1Qty = tc1R.reduce((s, r) => s + (r.totalQty ?? r.qty ?? 0), 0);
    const recordTc2Qty = tc2R.reduce((s, r) => s + (r.totalQty ?? r.qty ?? 0), 0);
    const recordTc3Qty = tc3R.reduce((s, r) => s + (r.totalQty ?? r.qty ?? 0), 0);
    const recordVmcQty = vmcR.reduce((s, r) => s + (r.totalQty ?? r.qty ?? 0), 0);

    const tc1Qty = adminQty ?? recordTc1Qty;
    const tc2Qty = adminQty ?? recordTc2Qty;
    const tc3Qty = adminQty ?? recordTc3Qty;
    const vmcQty = adminQty ?? recordVmcQty;

    const tc1Cost = tc1Qty > 0 ? (tc1Hrs * tcPrice) / tc1Qty : 0;
    const tc2Cost = tc2Qty > 0 ? (tc2Hrs * tcPrice) / tc2Qty : 0;
    const tc3Cost = tc3Qty > 0 ? (tc3Hrs * tcPrice) / tc3Qty : 0;
    const vmcCost = vmcQty > 0 ? (vmcHrs * vmcPrice) / vmcQty : 0;

    return {
      tc1: tc1Cost,
      tc2: tc2Cost,
      tc3: tc3Cost,
      vmc: vmcCost,
      tc1Total: tc1Qty > 0 && tc1Hrs > 0 ? tc1Cost + rawMaterialCost : 0,
      tc2Total: tc2Qty > 0 && tc2Hrs > 0 ? tc2Cost + rawMaterialCost : 0,
      tc3Total: tc3Qty > 0 && tc3Hrs > 0 ? tc3Cost + rawMaterialCost : 0,
      vmcTotal: vmcQty > 0 && vmcHrs > 0 ? vmcCost + rawMaterialCost : 0,
      rawMaterialCost,
      tc1Qty,
      tc2Qty,
      tc3Qty,
      vmcQty,
      tc1Hrs,
      tc2Hrs,
      tc3Hrs,
      vmcHrs,
      usedAdminQty: adminQty != null,
    };
  }, [filteredRecords, tcPrice, vmcPrice, adminEntries, filters.supplierName, filters.opn]);

  const handleTempFilterChange = (key: keyof ProductionFilters, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpnToggle = (value: string) => {
    setTempFilters((prev) => {
      const current = Array.isArray(prev.opn) ? [...prev.opn] : [prev.opn];
      const hasAll = current.includes('all');

      // Selecting All OPNs → treat as all only
      if (value === 'all') {
        return { ...prev, opn: hasAll ? [] : ['all'] };
      }

      // If All is selected and user picks another option, keep as All
      if (hasAll) {
        return { ...prev, opn: ['all'] };
      }

      // Normal multi-select when All is not selected
      const next = current.includes(value)
        ? current.filter((o) => o !== value)
        : [...current, value];

      return { ...prev, opn: next };
    });
  };

  const handleSortToggle = () => {
    setTempFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Update the saveFilters function
  const saveFilters = () => {
    console.log('=== Saving Filters ===');
    console.log('Previous filters:', filters);
    console.log('New filters to apply:', tempFilters);

    // Update the filters state
    setFilters(tempFilters);
    setSavedFilters(tempFilters);

    // Trigger the applyFilters function immediately
    applyFilters();

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
      internalJobOrder: 'all',
      customerName: 'all',
      supplierName: 'all',
      materialGrade: 'all',
      rawMaterialPricePerKgMin: '',
      rawMaterialPricePerKgMax: '',
      rawMaterialCostMin: '',
      rawMaterialCostMax: '',
      opn: ['all'],
    };

    // Reset all filters to default
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setSavedFilters(defaultFilters);

    // Trigger applyFilters to reset the filtered records
    applyFilters();

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
        'Date of Entry': new Date(record.dateOfEntry).toLocaleDateString('en-IN'),
        'Component Name': record.componentName || '',
        'Customer Name': record.customerName || '',
        'Internal Job Order': record.internalJobOrder || '',
        'Machine Name': record.machineName || '',
        'Operator Name': record.operatorName || '',
        'Shift': record.shift || '',
        'Quantity': record.qty || 0,
        'Additional Qty': record.additionalQty || 0,
        'Total Qty': record.totalQty || 0,
        'OPN': record.opn || '',
        'Program No': record.progNo || '',
        'Setting Time (HH:MM:SS)': record.settingTime || '00:00:00',
        'Cycle Time (HH:MM:SS)': record.cycleTime || '00:00:00',
        'Handling Time (HH:MM:SS)': record.handlingTime || '00:00:00',
        'Idle Time (HH:MM:SS)': record.idleTime || '00:00:00',
        'Start Time': typeof record.startTime === 'string' ? record.startTime : new Date(record.startTime).toLocaleString('en-IN'),
        'End Time': typeof record.endTime === 'string' ? record.endTime : new Date(record.endTime).toLocaleString('en-IN'),
        'Total Production Hr': record.totalProductionHr || 0,
        'Total Working Hr': record.totalWorkingHr || 0,
        'Supplier Name': record.supplierName || '',
        'Material Grade': record.materialGrade || '',
        'Raw Material Price Per Kg': record.rawMaterialPricePerKg || 0,
        'Raw Material Cost': record.rawMaterialCost || 0,
        'Remarks': record.remarks || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better spacing
      const columnWidths = [
        { wch: 12 }, // Date of Entry
        { wch: 25 }, // Component Name
        { wch: 20 }, // Customer Name
        { wch: 18 }, // Internal Job Order
        { wch: 12 }, // Machine Name
        { wch: 15 }, // Operator Name
        { wch: 10 }, // Shift
        { wch: 10 }, // Quantity
        { wch: 12 }, // Additional Qty
        { wch: 10 }, // Total Qty
        { wch: 8 },  // OPN
        { wch: 12 }, // Program No
        { wch: 18 }, // Setting Time
        { wch: 18 }, // Cycle Time
        { wch: 18 }, // Handling Time
        { wch: 18 }, // Idle Time
        { wch: 20 }, // Start Time
        { wch: 20 }, // End Time
        { wch: 18 }, // Total Production Hr
        { wch: 16 }, // Total Working Hr
        { wch: 20 }, // Supplier Name
        { wch: 15 }, // Material Grade
        { wch: 22 }, // Raw Material Price Per Kg
        { wch: 18 }, // Raw Material Cost
        { wch: 30 }, // Remarks
      ];
      
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Records');
      
      const fileName = `production_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
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

  const hasActiveFilters = tempFilters.search || tempFilters.startDate || tempFilters.endDate || 
    (tempFilters.internalJobOrder && tempFilters.internalJobOrder !== 'all') ||
    (tempFilters.customerName && tempFilters.customerName !== 'all') ||
    (tempFilters.supplierName && tempFilters.supplierName !== 'all') ||
    (tempFilters.materialGrade && tempFilters.materialGrade !== 'all') ||
    (Array.isArray(tempFilters.opn) && tempFilters.opn.length > 0 && !tempFilters.opn.includes('all')) ||
    tempFilters.rawMaterialPricePerKgMin || tempFilters.rawMaterialPricePerKgMax ||
    tempFilters.rawMaterialCostMin || tempFilters.rawMaterialCostMax;
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

  useEffect(() => {
    console.log('=== Processing Production Data ===');
    console.log('Production data length:', productionData?.length);
    
    if (productionData && productionData.length > 0) {
      const allRecords = productionData.map((record: any) => {
        const adminEntry = adminEntries.find((admin: any) => 
          admin.customerName === record.customerName && 
          admin.componentName === record.componentName
        );
        
        const internalJobOrder = adminEntry?.internalJobOrder || record.internalJobOrder || '';
        
        console.log('Processing record:', {
          componentName: record.componentName,
          internalJobOrder,
          originalJobOrder: record.internalJobOrder,
          adminJobOrder: adminEntry?.internalJobOrder
        });

        return {
          ...record,
          internalJobOrder,
        };
      });

      console.log('Sample processed records:', allRecords.slice(0, 3));
      setRecords(allRecords);
    }
  }, [productionData, adminEntries]);

  return (
    <div className="space-y-6">

       {/* Filters Section */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Internal Job Order Filter */}
            <Select
              value={tempFilters.internalJobOrder}
              onValueChange={(value) => handleTempFilterChange('internalJobOrder', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Job Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Orders</SelectItem>
                {filterOptions.jobOrders.map((jobOrder) => (
                  <SelectItem key={jobOrder} value={jobOrder}>
                    {jobOrder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* OPN Filter - multi select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                  type="button"
                >
                  <span className="truncate">
                    {(() => {
                      const selected = Array.isArray(tempFilters.opn) ? tempFilters.opn : [tempFilters.opn];
                      if (selected.length === 0) return 'Select OPNs';
                      if (selected.includes('all')) return 'All OPNs';
                      return selected.join(', ');
                    })()}
                  </span>
                  <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  <label className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={
                        Array.isArray(tempFilters.opn)
                          ? tempFilters.opn.includes('all')
                          : tempFilters.opn === 'all'
                      }
                      onCheckedChange={() => handleOpnToggle('all')}
                    />
                    All OPNs
                  </label>
                  {filterOptions.opns.map((opn) => {
                    const selected = Array.isArray(tempFilters.opn) ? tempFilters.opn : [tempFilters.opn];
                    const hasAll = selected.includes('all');
                    return (
                      <label
                        key={opn}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={!hasAll && selected.includes(opn)}
                          disabled={hasAll}
                          onCheckedChange={() => handleOpnToggle(opn)}
                        />
                        {opn}
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="row grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* TC machine price per hr - applies to TC-1, TC-2, TC-3 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">TC machine price per hr (₹)</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="250"
                  value={tcPricePerHr}
                  onChange={(e) => setTcPricePerHr(e.target.value || '')}
                />
              </div>

              {/* VMC price per hr */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">VMC price per hr (₹)</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="450"
                  value={vmcPricePerHr}
                  onChange={(e) => setVmcPricePerHr(e.target.value || '')}
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

      {/* Machine cost from TC / VMC price per hr (applied when filters are used) */}
      {filteredRecords.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {!tcPricePerHr.trim() && !vmcPricePerHr.trim()
              ? 'Calculation uses default TC price ₹250/hr and VMC price ₹450/hr. Enter values in the filter section to override.'
              : !tcPricePerHr.trim()
                ? 'Calculation uses default TC price ₹250/hr. Enter TC machine price per hr in filters to override.'
                : !vmcPricePerHr.trim()
                  ? 'Calculation uses default VMC price ₹450/hr. Enter VMC price per hr in filters to override.'
                  : 'Calculation uses the rates you entered above.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TC-1 production cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">₹{machineCostSummary.tc1.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">per piece ({(machineCostSummary.tc1Hrs * tcPrice).toFixed(0)} ÷ {machineCostSummary.tc1Qty} qty{machineCostSummary.usedAdminQty ? ' from admin' : ''})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TC-2 production cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">₹{machineCostSummary.tc2.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">per piece ({(machineCostSummary.tc2Hrs * tcPrice).toFixed(0)} ÷ {machineCostSummary.tc2Qty} qty{machineCostSummary.usedAdminQty ? ' from admin' : ''})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TC-3 production cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">₹{machineCostSummary.tc3.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">per piece ({(machineCostSummary.tc3Hrs * tcPrice).toFixed(0)} ÷ {machineCostSummary.tc3Qty} qty{machineCostSummary.usedAdminQty ? ' from admin' : ''})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">VMC production cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">₹{machineCostSummary.vmc.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">per piece ({(machineCostSummary.vmcHrs * vmcPrice).toFixed(0)} ÷ {machineCostSummary.vmcQty} qty{machineCostSummary.usedAdminQty ? ' from admin' : ''})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total production cost (+ rawMaterialCost)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TC-1</span>
                  <span className="font-semibold">₹{machineCostSummary.tc1Total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TC-2</span>
                  <span className="font-semibold">₹{machineCostSummary.tc2Total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TC-3</span>
                  <span className="font-semibold">₹{machineCostSummary.tc3Total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VMC</span>
                  <span className="font-semibold">₹{machineCostSummary.vmcTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  each = machine cost + ₹{machineCostSummary.rawMaterialCost.toFixed(2)} raw material
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Job Order Summary Cards */}
      {(hasActiveFilters || filters.internalJobOrder !== 'all') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRecords.length}</div>
              <p className="text-xs text-muted-foreground">Filtered records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              {(() => {
                const qtyByMachine = (name: string) =>
                  filteredRecords
                    .filter((r) => r.machineName === name)
                    .reduce((s, r) => s + (r.totalQty ?? r.qty ?? 0), 0);
                const tc1 = qtyByMachine('TC-1');
                const tc2 = qtyByMachine('TC-2');
                const tc3 = qtyByMachine('TC-3');
                const vmc = qtyByMachine('VMC');
                const total = tc1 + tc2 + tc3 + vmc;
                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TC-1</span>
                      <span className="font-semibold">{tc1.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TC-2</span>
                      <span className="font-semibold">{tc2.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TC-3</span>
                      <span className="font-semibold">{tc3.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VMC</span>
                      <span className="font-semibold">{vmc.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">{total.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          
        </div>
      )}

     

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
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Supplier</span>
                      <span className="text-xs font-medium">{record.supplierName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Material Grade</span>
                      <span className="text-xs font-medium">{record.materialGrade}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Material Cost</span>
                      <span className="text-xs font-medium">₹{record.rawMaterialCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    {record.internalJobOrder && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Job Order</span>
                        <span className="text-xs font-medium">{record.internalJobOrder}</span>
                      </div>
                    )}
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
