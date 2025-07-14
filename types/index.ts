export interface Product {
  name: string;
  category: string;
  price: number;
  quantity: number;
  supplier: string;
  inStock: boolean;
  lastUpdated: Date;
}

export interface DashboardSummary {
  totalProducts: number;
  productionHrs: string;
  workingHrs: string;
  idleHrs: string;
  machineData: {
    [key: string]: {
      productionHrs: string;
      workingHrs: string;
      idleHrs: string;
      qty: number;
    };
  };
  // Machine breakdown for Production Summary
  tc1ProdTime: string;
  tc2ProdTime: string;
  vmcProdTime: string;
  tc3ProdTime: string;
}

export interface ProductionRecord {
  _id?: string;
  componentName: string;
  customerName: string;
  machineName: string;
  operatorName: string;
  shift: string;
  qty: number;
  additionalQty: number;
  totalQty: number;
  opn: string;
  progNo: string;
  settingTime: number;
  cycleTime: number;
  handlingTime: number;
  idleTime: number;
  startTime: Date;
  endTime: Date;
  totalProductionHr: number;
  totalWorkingHr: number;
  remarks: string;
  dateOfEntry: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminEntry {
  _id?: string;
  customerName: string;
  componentName: string;
  qty: number;
  dcno: string;
  internalJobOrder?: string;
  machineName: string;
  operatorName: string;
  shift: string;
  additionalQty?: number;
  totalQty: number;
  opn: string;
  progNo: string;
  settingTime: number;
  cycleTime: number;
  handlingTime: number;
  idleTime: number;
  startTime: Date;
  endTime: Date;
  totalProductionHr: number;
  totalWorkingHr: number;
  remarks?: string;
  dateOfEntry: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductionFilters {
  search: string;
  sortBy: 'componentName' | 'customerName' | 'machineName' | 'dateOfEntry';
  sortOrder: 'asc' | 'desc';
  startDate: string;
  endDate: string;
}

export interface EmployeeForm {
  _id?: string;
  operatorName: string;
  date: Date;
  shift: string;
  machine: string;
  customerName: string;
  componentName: string;
  qty: number;
  additionalQty?: number;
  opn: string;
  progNo: string;
  settingTime: string;
  cycleTime: string;
  handlingTime: string;
  idleTime: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}