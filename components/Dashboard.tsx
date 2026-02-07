'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { 
  Package, 
  AlertCircle, 
  DollarSign, 
  Boxes, 
  Plus, 
  Clock, 
  Factory, 
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Download,
  RotateCcw,
  Save
} from 'lucide-react';
import { DashboardSummary } from '@/types';
import AnalyticsTab from './AnalyticsTab';
import * as XLSX from 'xlsx';
import { getEmployeeData, getCustomerList, formatDate, getTotalMachineHrs, getTotalIdleTime, getTotalWorkingHrs, addTimes } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Production data will be fetched from API

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [productionData, setProductionData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    customer: '',
    component: '',
    machine: '',
    startDate: '',
    endDate: '',
  });

  const [tempFilters, setTempFilters] = useState({
    search: '',
    customer: '',
    component: '',
    machine: '',
    startDate: '',
    endDate: '',
  });

  const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from 2016 to 2025 to include all available data
        const startDate = '01-01-2016'; // Start from 2016 to get all historical data
        const endDate = '31-12-2025'; // End date to include all data
        
        const employeeData = await getEmployeeData(startDate, endDate);
        const customerData = await getCustomerList();
        
        if (!employeeData || !customerData) {
          throw new Error('Failed to fetch data');
        }

        // Process data with machine hours calculation (matches React Native)
        let finalData = employeeData;
        if (employeeData.length > 0) {
          // Use getTotalMachineHrs with workMode=true to get processed data with calculated fields
          finalData = getTotalMachineHrs(employeeData, true);
          
          // Debug: Check the processed data
          console.log('Processed data sample:', finalData.slice(0, 3));
          console.log('TC-1 data:', finalData.filter((item: any) => item.machine === 'TC-1').slice(0, 3));
          
          // Map the processed data to match expected format
          finalData = finalData.map((item: any) => ({
            ...item,
            dateOfEntry: item.date || item.dateOfEntry,
            customerName: item.customerName || 'Unknown',
            componentName: item.componentName || 'Unknown',
            machineName: item.machine || 'Unknown',
            operatorName: item.operatorName || 'Unknown',
            qty: item.qty || 0,
            totalQty: item.totalQty || item.qty || 0,
            shift: item.shift || 'Unknown',
            // Add admin entry data to production records
            supplierName: 'Unknown',
            rawMaterialPricePerKg: 0,
            materialGrade: 'Unknown',
            rawMaterialCost: 0,
            internalJobOrder: item?.internalJobOrder,
          }));
          
          // Merge with admin entry data
          finalData = finalData.map((item: any) => {
            const adminEntry = customerData.find((admin: any) => 
              admin.customerName === item.customerName && 
              admin.componentName === item.componentName &&
              (admin.internalJobOrder === item.internalJobOrder || !item.internalJobOrder)
            );
            
            if (adminEntry) {
              return {
                ...item,
                supplierName: adminEntry.supplierName || 'Unknown',
                rawMaterialPricePerKg: adminEntry.rawMaterialPricePerKg || 0,
                materialGrade: adminEntry.materialGrade || 'Unknown',
                rawMaterialCost: adminEntry.rawMaterialCost || 0,
                internalJobOrder: adminEntry.internalJobOrder || '',
              };
            }
            
            return item;
          });
        }

        // Calculate dashboard summary - matches React Native logic exactly
        const totalProducts = finalData.length;

        // Machine breakdown for Production Summary - matches React Native exactly
        const tc1Components = finalData.filter((obj: any) => obj.machine === 'TC-1');
        const tc2Components = finalData.filter((obj: any) => obj.machine === 'TC-2');
        const vmcComponents = finalData.filter((obj: any) => obj.machine === 'VMC');
        const tc3Components = finalData.filter((obj: any) => obj.machine === 'TC-3');
        
        // Debug: Log machine counts
        console.log('Machine counts:', {
          'TC-1': tc1Components.length,
          'TC-2': tc2Components.length,
          'VMC': vmcComponents.length,
          'TC-3': tc3Components.length
        });
        
        const totalProdTc1Time = getTotalMachineHrs(tc1Components, false) as { machineTotalTime: string; componentWiseMachiHrObj: any };
        const totalProdTc2Time = getTotalMachineHrs(tc2Components, false) as { machineTotalTime: string; componentWiseMachiHrObj: any };
        const totalProdVMCTime = getTotalMachineHrs(vmcComponents, false) as { machineTotalTime: string; componentWiseMachiHrObj: any };
        const totalProdTc3Time = getTotalMachineHrs(tc3Components, false) as { machineTotalTime: string; componentWiseMachiHrObj: any };
        
        // Debug: Log machine total times
        console.log('Machine total times:', {
          'TC-1': totalProdTc1Time.machineTotalTime,
          'TC-2': totalProdTc2Time.machineTotalTime,
          'VMC': totalProdVMCTime.machineTotalTime,
          'TC-3': totalProdTc3Time.machineTotalTime
        });

        // Format machine times exactly like React Native
        const formatMachineTimeFromString = (timeString: string) => {
          if (!timeString || timeString === '00:00:00') return '0hr 0mins 0sec';
          const parts = timeString.split(':');
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          const seconds = parseInt(parts[2]) || 0;
          return `${hours}hr ${minutes}mins ${seconds}sec`;
        };

        const tc1ProdTime = formatMachineTimeFromString(totalProdTc1Time.machineTotalTime);
        const tc2ProdTime = formatMachineTimeFromString(totalProdTc2Time.machineTotalTime);
        const vmcProdTime = formatMachineTimeFromString(totalProdVMCTime.machineTotalTime);
        const tc3ProdTime = formatMachineTimeFromString(totalProdTc3Time.machineTotalTime);

        // Calculate total idle time
        const totalIdleTime = getTotalIdleTime(finalData);
        console.log('Total idle time:', totalIdleTime);
        const idleHr = parseFloat(totalIdleTime.idleTime.split(":")[0]);
        const idleMin = parseFloat(totalIdleTime.idleTime.split(":")[1]);
        const idleSec = parseFloat(totalIdleTime.idleTime.split(":")[2]);
        const totalIdleHr = `${new Date(0, 0, 0, idleHr, idleMin, idleSec).getHours()}hr ${new Date(0, 0, 0, idleHr, idleMin, idleSec).getMinutes()}mins`;

        // Calculate total working hours - matches React Native exactly
        // First process the data to get totalWorkingHrs field
        const processedData = getTotalMachineHrs(finalData, true) as any[];
        const totalWorkingHrsData = getTotalWorkingHrs(processedData);
        console.log('Total working hours:', totalWorkingHrsData);
        const workingHr = parseFloat(totalWorkingHrsData.totalWorkingHrs.split(":")[0]);
        const workingMin = parseFloat(totalWorkingHrsData.totalWorkingHrs.split(":")[1]);
        const totalWorkingHr = `${workingHr}hr ${workingMin}mins`;

        // Calculate total production hours - matches React Native exactly
        const toalProdHrs = addTimes(totalProdTc1Time.machineTotalTime, totalProdTc2Time.machineTotalTime, '00:00:00');
        const toalProdHrsReCalc = addTimes(toalProdHrs, totalProdVMCTime.machineTotalTime, '00:00:00');
        const toalProdHrsReCalcOverall = addTimes(toalProdHrsReCalc, totalProdTc3Time.machineTotalTime, '00:00:00');
        
        // Format total production hours like React Native
        const formatTotalProdTime = (timeString: string) => {
          if (!timeString || timeString === '00:00:00') return '0hr 0mins 0sec';
          const parts = timeString.split(':');
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          const seconds = parseInt(parts[2]) || 0;
          return `${hours}hr ${minutes}mins ${seconds}sec`;
        };

        const calculatedTotalProductionHrs = formatTotalProdTime(toalProdHrsReCalcOverall);

        // Calculate machine-wise data for charts - use processed data with calculated fields
        const machineData: any = {};
        finalData.forEach((item: any) => {
          const machine = item.machine || item.machineName;
          if (!machine) return;
          
          const normalizedMachine = machine.replace(/-/g, '').toUpperCase();
          if (!machineData[normalizedMachine]) {
            machineData[normalizedMachine] = {
              productionHrs: '00:00:00',
              workingHrs: '00:00:00',
              idleHrs: '00:00:00',
              qty: 0
            };
          }
          
          // Use the calculated totalProductionHr from getTotalMachineHrs
          if (item.totalProductionHr) {
            machineData[normalizedMachine].productionHrs = addTimes(machineData[normalizedMachine].productionHrs, item.totalProductionHr);
          }
          
          if (item.totalWorkingHrs) {
            machineData[normalizedMachine].workingHrs = addTimes(machineData[normalizedMachine].workingHrs, item.totalWorkingHrs);
          }
          if (item.idleTime) {
            machineData[normalizedMachine].idleHrs = addTimes(machineData[normalizedMachine].idleHrs, item.idleTime);
          }
          machineData[normalizedMachine].qty += Number(item.qty) || 0;
        });

        setProductionData(finalData);
        setFilteredData(finalData);
        setCustomerList(customerData);

        // Set dashboard summary - matches React Native exactly
        setData({
          totalProducts,
          productionHrs: calculatedTotalProductionHrs,
          workingHrs: totalWorkingHr,
          idleHrs: totalIdleHr,
          machineData,
          // Machine breakdown for Production Summary
          tc1ProdTime,
          tc2ProdTime,
          vmcProdTime,
          tc3ProdTime
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Time utility function
  // Remove the local addTimes definition, use the imported one

  // Convert time string to hours for display
  const timeToHours = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  };

  useEffect(() => {
    console.log('Filters updated:', filters);
    applyFilters();
  }, [filters, productionData]);

  const applyFilters = () => {
    console.log('Applying filters:', filters);
    let filtered = [...productionData];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.customerName.toLowerCase().includes(searchTerm) ||
          item.componentName.toLowerCase().includes(searchTerm) ||
          item.machineName.toLowerCase().includes(searchTerm) ||
          item.operatorName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply customer filter
    if (filters.customer && filters.customer !== 'all') {
      filtered = filtered.filter((item) => item.customerName === filters.customer);
    }

    // Apply component filter
    if (filters.component && filters.component !== 'all') {
      filtered = filtered.filter((item) => item.componentName === filters.component);
    }

    // Apply machine filter
    if (filters.machine && filters.machine !== 'all') {
      filtered = filtered.filter((item) => item.machineName === filters.machine);
    }

    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter((item) => {
        const entryDate = new Date(item.dateOfEntry);
        return entryDate.toISOString().split('T')[0] >= startDate.toISOString().split('T')[0];
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter((item) => {
        const entryDate = new Date(item.dateOfEntry);
        return entryDate.toISOString().split('T')[0] <= endDate.toISOString().split('T')[0];
      });
    }

    setFilteredData(filtered);
  };

  const handleTempFilterChange = (key: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const saveFilters = () => {
    console.log('Saving filters:', tempFilters);
    setFilters(tempFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      customer: '',
      component: '',
      machine: '',
      startDate: '',
      endDate: '',
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredData.map(item => ({
        'Date of Entry': new Date(item.dateOfEntry).toLocaleDateString('en-IN'),
        'Component Name': item.componentName,
        'Customer Name': item.customerName,
        'Internal Job Order': item.internalJobOrder || '',
        'Machine Name': item.machineName,
        'Operator Name': item.operatorName,
        'Shift': item.shift,
        'Quantity': item.qty,
        'Additional Qty': item.additionalQty || 0,
        'Total Qty': item.totalQty,
        'OPN': item.opn || '',
        'Program No': item.progNo || '',
        'Setting Time (HH:MM:SS)': item.settingTime || '00:00:00',
        'Cycle Time (HH:MM:SS)': item.cycleTime || '00:00:00',
        'Handling Time (HH:MM:SS)': item.handlingTime || '00:00:00',
        'Idle Time (HH:MM:SS)': item.idleTime || '00:00:00',
        'Start Time': typeof item.startTime === 'string' ? item.startTime : new Date(item.startTime).toLocaleString('en-IN'),
        'End Time': typeof item.endTime === 'string' ? item.endTime : new Date(item.endTime).toLocaleString('en-IN'),
        'Production Hours': item.totalProductionHr,
        'Working Hours': item.totalWorkingHrs || item.totalWorkingHr,
        'Supplier Name': item.supplierName || '',
        'Material Grade': item.materialGrade || '',
        'Raw Material Price Per Kg': item.rawMaterialPricePerKg || 0,
        'Raw Material Cost': item.rawMaterialCost || 0,
        'Remarks': item.remarks || '',
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
        { wch: 16 }, // Production Hours
        { wch: 14 }, // Working Hours
        { wch: 20 }, // Supplier Name
        { wch: 15 }, // Material Grade
        { wch: 22 }, // Raw Material Price Per Kg
        { wch: 18 }, // Raw Material Cost
        { wch: 30 }, // Remarks
      ];
      
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard_Data');
      
      const fileName = `dashboard_production_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: 'Success',
        description: 'Excel file downloaded successfully',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to download Excel file',
        variant: 'destructive',
      });
    }
  };

  const getMachineHrsAccurate = (machineName: string) => {
    if(machineName === 'TC1'){
      return data?.tc1ProdTime;
    }else if(machineName === 'TC2'){
      return data?.tc2ProdTime;
    }else if(machineName === 'VMC'){
      return data?.vmcProdTime;
    }else if(machineName === 'TC3'){
      return data?.tc3ProdTime;
    }
    return '00:00:00';
  };

  // New functions to handle formatted time strings
  const parseFormattedTime = (timeString: string): number => {
    if (!timeString) return 0;
    
    // Handle format like "12345hrs 50mins 50sec" or "12345hr 50mins"
    const hoursMatch = timeString.match(/(\d+)hrs?/);
    const minutesMatch = timeString.match(/(\d+)mins?/);
    const secondsMatch = timeString.match(/(\d+)secs?/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
    
    return hours + (minutes / 60) + (seconds / 3600);
  };

  const formatTimeForDisplay = (timeString: string): string => {
    if (!timeString) return '0hr 0mins';
    
    // If it's already formatted, return as is
    if (timeString.includes('hr') || timeString.includes('mins')) {
      return timeString;
    }
    
    // If it's in HH:MM:SS format, convert
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return `${hours}hr ${minutes}mins ${seconds}sec`;
    }
    
    return timeString;
  };

  // Get unique values for filter dropdowns
  const uniqueCustomers = Array.from(new Set(productionData.map(item => item.customerName)));
  const uniqueComponents = Array.from(new Set(productionData.map(item => item.componentName)));
  const uniqueMachines = Array.from(new Set(productionData.map(item => item.machineName)));

  const hasUnsavedChanges = JSON.stringify(tempFilters) !== JSON.stringify(filters);

  console.log('Dashboard productionData length:', productionData?.length || 0);

  const transformMachineData = (data: any[]) => {
    const machineData: any = {};

    data.forEach((item) => {
      const machine = item.machineName || 'Unknown';
      if (!machineData[machine]) {
        machineData[machine] = {
          productionHrs: '00:00:00',
          workingHrs: '00:00:00',
          idleHrs: '00:00:00',
          qty: 0,
        };
      }

      machineData[machine].productionHrs = addTimes(
        machineData[machine].productionHrs,
        item.totalProductionHr || '00:00:00'
      );
      machineData[machine].workingHrs = addTimes(
        machineData[machine].workingHrs,
        item.totalWorkingHrs || item.totalWorkingHr || '00:00:00'
      );
      machineData[machine].idleHrs = addTimes(
        machineData[machine].idleHrs,
        item.idleTime || '00:00:00'
      );
      machineData[machine].qty += item.qty || 0;
    });

    return machineData;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Showing all {productionData.length} production records from 2020 to 2025</p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Link href="/data/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div> */}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Data Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10"
                    value={tempFilters.search}
                    onChange={(e) => handleTempFilterChange('search', e.target.value)}
                  />
                </div>

                {/* Customer Filter */}
                <Select
                  value={tempFilters.customer}
                  onValueChange={(value) => handleTempFilterChange('customer', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {uniqueCustomers.map((customer) => (
                      <SelectItem key={customer} value={customer}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Component Filter */}
                <Select
                  value={tempFilters.component}
                  onValueChange={(value) => handleTempFilterChange('component', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Components" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    {uniqueComponents.map((component) => (
                      <SelectItem key={component} value={component}>
                        {component}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Machine Filter */}
                <Select
                  value={tempFilters.machine}
                  onValueChange={(value) => handleTempFilterChange('machine', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Machines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Machines</SelectItem>
                    {uniqueMachines.map((machine) => (
                      <SelectItem key={machine} value={machine}>
                        {machine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredData.length} of {productionData.length} records
                  </p>
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

          <h4 className="text-3xl font-bold tracking-tight">Machine(s)</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-16" />
                    <Factory className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[100px]" />
                  </CardContent>
                </Card>
              ))
            ) : (
              // Dynamically compute machine data based on filters
              Object.entries(
                filteredData.length > 0
                  ? transformMachineData(filteredData)
                  : data?.machineData || {}
              ).map(([machineName, machineInfo]: [string, any]) => (
                <Card key={machineName}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{machineName}</CardTitle>
                    <Factory className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {formatTimeForDisplay(machineInfo.productionHrs)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Production time: {formatTimeForDisplay(machineInfo.productionHrs)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accurate Machine Hours: {getMachineHrsAccurate(machineName)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <h4 className="text-3xl font-bold tracking-tight">Production Summary</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Production Hour */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Production Hour</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {formatTimeForDisplay(
                        (filteredData.length > 0 ? filteredData : productionData).reduce(
                          (acc: string, item: any) =>
                            addTimes(acc, item.totalProductionHr || '00:00:00'),
                          '00:00:00'
                        )
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Total across all machines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Idle Hour */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Idle Hour</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {formatTimeForDisplay(
                        (filteredData.length > 0 ? filteredData : productionData).reduce(
                          (acc: string, item: any) =>
                            addTimes(acc, item.idleTime || '00:00:00'),
                          '00:00:00'
                        )
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Downtime across machines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Working Hour */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Working Hour</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {formatTimeForDisplay(
                        (filteredData.length > 0 ? filteredData : productionData).reduce(
                          (acc: string, item: any) =>
                            addTimes(acc, item.totalWorkingHrs || item.totalWorkingHr || '00:00:00'),
                          '00:00:00'
                        )
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Effective working time</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Efficiency */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const dataToUse = filteredData.length > 0 ? filteredData : productionData;
                        const totalWorkingHrs = dataToUse.reduce(
                          (acc: string, item: any) =>
                            addTimes(acc, item.totalWorkingHrs || item.totalWorkingHr || '00:00:00'),
                          '00:00:00'
                        );
                        const totalProductionHrs = dataToUse.reduce(
                          (acc: string, item: any) =>
                            addTimes(acc, item.totalProductionHr || '00:00:00'),
                          '00:00:00'
                        );
                        const workingHrs = parseFormattedTime(totalWorkingHrs);
                        const productionHrs = parseFormattedTime(totalProductionHrs);
                        return workingHrs > 0
                          ? ((productionHrs / workingHrs) * 100).toFixed(1)
                          : '0.0';
                      })()}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Production efficiency</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Component Production Hours by Machine */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Component Production Hours</CardTitle>
                <CardDescription>Production hours by machine</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={Object.entries(
                        filteredData.length > 0 ? transformMachineData(filteredData) : data?.machineData || {}
                      ).map(([name, info]: [string, any]) => ({
                        name,
                        hours: timeToHours(info.productionHrs),
                        components: info.qty,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="hours"
                        name="Production Hours"
                        fill={CHART_COLORS[0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Machine Efficiency */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Machine Efficiency</CardTitle>
                <CardDescription>Efficiency percentage by machine</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={Object.entries(data?.machineData || {}).map(([name, info]: [string, any], index: number) => {
                          const workingHrs = timeToHours(info.workingHrs);
                          const productionHrs = timeToHours(info.productionHrs);
                          const efficiency = workingHrs > 0 ? (productionHrs / workingHrs) * 100 : 0;

                          return {
                            name,
                            value: Math.round(efficiency),
                            fill: CHART_COLORS[index % CHART_COLORS.length],
                          };
                        })}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <AnalyticsTab 
            productionData={filteredData.length > 0 ? filteredData : productionData} // Use filteredData if available, otherwise fallback to productionData
            loading={loading}
            dashboardData={data}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}