import * as XLSX from 'xlsx';
import { addTimes } from './utils';

function asTime(value: unknown): string {
  if (value == null || value === '' || value === 0) return '00:00:00';
  const text = String(value);
  if (!text.includes(':')) return '00:00:00';
  const parts = text.split(':');
  while (parts.length < 3) parts.push('00');
  return parts.slice(0, 3).map((part) => part || '00').join(':');
}

function machineLabel(name: string) {
  const raw = String(name || '').trim();
  const compact = raw.replace(/[\s_]/g, '').toUpperCase();
  if (/^TC1$/.test(compact)) return 'TC-1';
  if (/^TC2$/.test(compact)) return 'TC-2';
  if (/^TC3$/.test(compact)) return 'TC-3';
  if (/^VMC$/.test(compact)) return 'VMC';
  if (/^VMC\d+$/.test(compact)) return `VMC-${compact.slice(3)}`;
  return raw || 'Other';
}

function sumHours(rows: { totalProductionHr?: unknown }[]) {
  return rows.reduce((total, row) => addTimes(total, asTime(row.totalProductionHr)), '00:00:00');
}

export function buildJobOrderSheet(records: any[] = []) {
  const rows = records.map((record) => ({
    dateOfEntry: record.dateOfEntry || record.date,
    componentName: record.componentName || '',
    customerName: record.customerName || '',
    internalJobOrder: record.internalJobOrder || '',
    machineName: machineLabel(record.machineName || record.machine || ''),
    operatorName: record.operatorName || '',
    shift: record.shift || '',
    qty: Number(record.qty) || 0,
    totalProductionHr: record.totalProductionHr,
    rawMaterialCost: Number(record.rawMaterialCost) || 0,
    materialGrade: record.materialGrade || '',
    supplierName: record.supplierName || '',
    costKey: [
      record.internalJobOrder || '',
      record.customerName || '',
      record.componentName || '',
      record.rawMaterialCost || 0,
    ].join('|'),
  }));

  const machines = ['TC-1', 'TC-2', 'TC-3', 'VMC'];
  rows.forEach((row) => {
    if (!machines.includes(row.machineName)) machines.push(row.machineName);
  });

  const sheetRows: (string | number)[][] = [[
    'Date of Entry',
    'Component Name',
    'Customer Name',
    'Internal Job Order',
    'Machine Name',
    'Operator Name',
    'Shift',
    'Quantity',
    'Production Hours',
    'Material Grade',
    'Supplier Name',
    'Material Cost',
  ]];

  rows.forEach((row) => {
    sheetRows.push([
      row.dateOfEntry ? new Date(row.dateOfEntry).toLocaleDateString('en-IN') : '',
      row.componentName,
      row.customerName,
      row.internalJobOrder,
      row.machineName,
      row.operatorName,
      row.shift,
      row.qty,
      asTime(row.totalProductionHr),
      row.materialGrade,
      row.supplierName,
      row.rawMaterialCost,
    ]);
  });

  const groups = new Map<string, typeof rows>();
  rows.forEach((row) => {
    const key = row.internalJobOrder || 'No job order';
    const current = groups.get(key) || [];
    current.push(row);
    groups.set(key, current);
  });

  sheetRows.push([]);
  sheetRows.push(['JOB ORDER SUMMARY']);
  sheetRows.push([
    'Internal Job Order',
    'Customer Name',
    'Component Name',
    ...machines.map((machine) => `${machine} Production`),
    'Total Quantity',
    'Material Cost',
  ]);

  const countedCosts = new Set<string>();
  let overallCost = 0;

  groups.forEach((group, jobOrder) => {
    const seen = new Set<string>();
    let cost = 0;
    group.forEach((row) => {
      if (seen.has(row.costKey)) return;
      seen.add(row.costKey);
      cost += row.rawMaterialCost;
      if (!countedCosts.has(row.costKey)) {
        countedCosts.add(row.costKey);
        overallCost += row.rawMaterialCost;
      }
    });

    sheetRows.push([
      jobOrder,
      [...new Set(group.map((row) => row.customerName).filter(Boolean))].join(', '),
      [...new Set(group.map((row) => row.componentName).filter(Boolean))].join(', '),
      ...machines.map((machine) => sumHours(group.filter((row) => row.machineName === machine))),
      group.reduce((sum, row) => sum + row.qty, 0),
      cost,
    ]);
  });

  sheetRows.push([]);
  sheetRows.push(['OVERALL SUMMARY']);
  machines.forEach((machine) => {
    sheetRows.push([`${machine} Production`, sumHours(rows.filter((row) => row.machineName === machine))]);
  });
  sheetRows.push(['Total Quantity', rows.reduce((sum, row) => sum + row.qty, 0)]);
  sheetRows.push(['Total Material Cost', overallCost]);

  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet['!cols'] = [14, 28, 22, 20, 14, 16, 12, 12, 20, 16, 20, 16].map((wch) => ({ wch }));
  return sheet;
}
