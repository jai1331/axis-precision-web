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

function sumCycleTimes(rows: { cycleTime?: unknown }[]) {
  return rows.reduce((total, row) => addTimes(total, asTime(row.cycleTime)), '00:00:00');
}

function timeToHours(value: unknown): number {
  const text = asTime(value);
  const [hours = '0', minutes = '0', seconds = '0'] = text.split(':');
  return (
    (Number(hours) || 0) +
    (Number(minutes) || 0) / 60 +
    (Number(seconds) || 0) / 3600
  );
}

interface JobOrderSheetOptions {
  tcPricePerHr?: number;
  vmcPricePerHr?: number;
  adminEntries?: any[];
  supplierName?: string;
  opn?: string | string[];
}

export function buildJobOrderSheet(
  records: any[] = [],
  options: JobOrderSheetOptions = {},
) {
  const rows = records.map((record) => ({
    dateOfEntry: record.dateOfEntry || record.date,
    componentName: record.componentName || '',
    customerName: record.customerName || '',
    internalJobOrder: record.internalJobOrder || '',
    machineName: machineLabel(record.machineName || record.machine || ''),
    operatorName: record.operatorName || '',
    shift: record.shift || '',
    opn: record.opn || '',
    qty: Number(record.qty) || 0,
    totalQty: Number(record.totalQty) || Number(record.qty) || 0,
    totalProductionHr: record.totalProductionHr,
    cycleTime: record.cycleTime,
    poPrice: Number(record.poPrice) || 0,
    rawMaterialCost: Number(record.rawMaterialCost) || 0,
    materialGrade: record.materialGrade || '',
    supplierName: record.supplierName || '',
  }));

  const machines = ['TC-1', 'TC-2', 'TC-3', 'VMC', 'VMC-2'];
  const tcPricePerHour = options.tcPricePerHr || 250;
  const vmcPricePerHour = options.vmcPricePerHr || 450;
  const adminEntries = options.adminEntries || [];
  const supplierName = options.supplierName || 'all';
  const selectedOpns = Array.isArray(options.opn)
    ? options.opn
    : [options.opn || 'all'];
  const sheetRows: (string | number)[][] = [];
  const groups = new Map<string, typeof rows>();
  rows.forEach((row) => {
    const key = row.internalJobOrder || 'No job order';
    const current = groups.get(key) || [];
    current.push(row);
    groups.set(key, current);
  });

  sheetRows.push(['JOB ORDER SUMMARY']);
  sheetRows.push([
    'Internal Job Order',
    'Customer Name',
    'Component Name',
    'PO Price',
    'Cycle Time',
    ...machines.map((machine) => `${machine} Production`),
    'Total Production Hours',
    ...machines.map((machine) => `${machine} Production Cost (per piece)`),
    'Total Quantity',
    'Raw Material',
    'Total Cost (actual)',
    ...machines.map((machine) => `${machine} Actual Expense`),
    'App-Style Total Cost',
  ]);

  groups.forEach((group, jobOrder) => {
    const matchedAdmin = adminEntries.find((admin) => {
      const supplierOk =
        supplierName === 'all' || admin.supplierName === supplierName;
      if (!supplierOk) return false;

      return group.some((row) => {
        const supplierRecordOk =
          supplierName === 'all'
            ? admin.supplierName === row.supplierName || row.supplierName === 'Unknown'
            : admin.supplierName === supplierName;
        const isAllOpns = selectedOpns.length === 0 || selectedOpns.includes('all');
        const opnOk = isAllOpns
          ? !admin.opn || admin.opn === row.opn
          : selectedOpns.includes(row.opn) &&
            (!admin.opn || selectedOpns.includes(admin.opn));
        return admin.componentName === row.componentName && supplierRecordOk && opnOk;
      });
    });
    const adminQty =
      matchedAdmin?.qty != null && Number(matchedAdmin.qty) > 0
        ? Number(matchedAdmin.qty)
        : null;
    const rawMaterialCost = matchedAdmin?.rawMaterialCost != null
      ? Number(matchedAdmin.rawMaterialCost) || 0
      : (group.find((row) => row.rawMaterialCost > 0)?.rawMaterialCost ?? 0);

    const quantity = group.reduce((sum, row) => sum + row.qty, 0);
    const machineRows = machines.map((machine) =>
      group.filter((row) => row.machineName === machine),
    );
    const machineHours = machineRows.map((rowsForMachine) =>
      rowsForMachine.reduce(
        (sum, row) => sum + timeToHours(row.totalProductionHr),
        0,
      ),
    );
    const machineExpenses = machineHours.map((hours, index) => {
      const machine = machines[index];
      const pricePerHour = machine === 'VMC' || machine === 'VMC-2'
        ? vmcPricePerHour
        : tcPricePerHour;
      return hours * pricePerHour;
    });
    const machineCosts = machineRows.map((rowsForMachine, index) => {
      const recordQuantity = rowsForMachine.reduce(
        (sum, row) => sum + row.totalQty,
        0,
      );
      const machineQuantity = adminQty ?? recordQuantity;
      if (machineQuantity <= 0) return 0;
      return machineExpenses[index] / machineQuantity;
    });
    const appStyleTotalCost =
      machineCosts.reduce((sum, value) => sum + value, 0) + rawMaterialCost;
    const actualTotalCost =
      machineExpenses.reduce((sum, value) => sum + value, 0) + rawMaterialCost;
    const poPrices = [...new Set(group.map((row) => row.poPrice).filter((price) => price > 0))];
    const poPrice = poPrices.length > 1 ? poPrices.join(', ') : poPrices[0] || 0;

    sheetRows.push([
      jobOrder,
      [...new Set(group.map((row) => row.customerName).filter(Boolean))].join(', '),
      [...new Set(group.map((row) => row.componentName).filter(Boolean))].join(', '),
      poPrice,
      sumCycleTimes(group),
      ...machineRows.map((rowsForMachine) => sumHours(rowsForMachine)),
      sumHours(group),
      ...machineCosts,
      quantity,
      rawMaterialCost,
      actualTotalCost,
      ...machineExpenses,
      appStyleTotalCost,
    ]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet['!cols'] = [
    14, 28, 22, 14, 16, 16, 16, 16, 16, 16,
    20, 22, 24, 24, 24, 24, 24, 12, 16, 16,
    20, 20, 20, 20, 20,
  ].map((wch) => ({ wch }));

  const headerRow = 1;
  const headerCount = sheetRows[1]?.length || 0;
  for (let column = 0; column < headerCount; column += 1) {
    const address = XLSX.utils.encode_cell({ r: headerRow, c: column });
    if (sheet[address]) sheet[address].s = { font: { bold: true } };
  }
  return sheet;
}
