import { Request, Response } from 'express';
import EmployeeForm from '../models/EmployeeForm';
import moment from 'moment';
import * as XLSX from 'xlsx';
import path from 'path';

// Create employee form entry
export const createEmployeeEntry = async (req: Request, res: Response) => {
  try {
    const {
      operatorName,
      date,
      shift,
      machine,
      customerName,
      componentName,
      qty,
      additionalQty,
      opn,
      progNo,
      settingTime,
      cycleTime,
      handlingTime,
      idleTime,
      startTime,
      endTime,
      remarks,
      internalJobOrder, // Add this field
    } = req.body;

    let finalDate = date;
    if (String(date).includes('T')) {
      finalDate = date;
    } else {
      const startDateFormatted = `${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`;
      finalDate = new Date(startDateFormatted).toISOString();
    }

    const response = await EmployeeForm.create({
      operatorName,
      date: finalDate,
      shift,
      machine,
      customerName,
      componentName,
      qty,
      additionalQty,
      opn,
      progNo,
      settingTime,
      cycleTime,
      handlingTime,
      idleTime,
      startTime,
      endTime,
      remarks,
      internalJobOrder, // Save this field
    });

    if (response) {
      return res.json({ status: 'ok', response: response });
    }
  } catch (error) {
    return res.json({ status: 'error', error: 'Unable to save' });
  }
};

// Get employee data with date filtering
export const getEmployeeData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let queryStr: any = {};
    
    if (endDate) {
      const endDateFormatted = `${endDate.toString().split('-')[1]}-${endDate.toString().split('-')[0]}-${endDate.toString().split('-')[2]}`;
      queryStr.date = {
        $lt: moment(endDateFormatted).endOf('day').toDate().toISOString()
      };
    }
    
    if (startDate && String(startDate) !== String(endDate)) {
      const startDateFormatted = `${startDate.toString().split('-')[1]}-${startDate.toString().split('-')[0]}-${startDate.toString().split('-')[2]}`;
      const endDateFormatted = endDate ? `${endDate.toString().split('-')[1]}-${endDate.toString().split('-')[0]}-${endDate.toString().split('-')[2]}` : null;
      
      if (endDateFormatted) {
        queryStr.date = {
          $gte: new Date(startDateFormatted).toISOString(),
          $lt: moment(endDateFormatted).endOf('day').toDate().toISOString()
        };
      } else {
        queryStr.date = {
          $gte: new Date(startDateFormatted).toISOString()
        };
      }
    }

    const response = await EmployeeForm.find(queryStr).sort({ date: -1 });
    
    if (response) {
      return res.json(response);
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Update employee form entry
export const updateEmployeeEntry = async (req: Request, res: Response) => {
  try {
    const { id, date, ...updateData } = req.body;
    const entryId = id || req.params.id;
    
    let finalDate = date;
    if (date) {
      if (String(date).includes('T')) {
        finalDate = date;
      } else {
        const startDateFormatted = `${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`;
        finalDate = new Date(startDateFormatted).toISOString();
      }
    }

    const updatedEntry = await EmployeeForm.findByIdAndUpdate(
      entryId,
      { ...updateData, ...(finalDate && { date: finalDate }) },
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Employee entry not found' });
    }
    
    res.status(200).json({ status: 'ok', response: updatedEntry });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Unable to update' });
  }
};

// Download Excel export
export const downloadExcel = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let queryStr: any = {};
    
    if (endDate) {
      const endDateFormatted = `${endDate.toString().split('-')[1]}-${endDate.toString().split('-')[0]}-${endDate.toString().split('-')[2]}`;
      queryStr.date = {
        $lt: moment(endDateFormatted).endOf('day').toDate().toISOString()
      };
    }
    
    if (startDate && String(startDate) !== String(endDate)) {
      const startDateFormatted = `${startDate.toString().split('-')[1]}-${startDate.toString().split('-')[0]}-${startDate.toString().split('-')[2]}`;
      const endDateFormatted = endDate ? `${endDate.toString().split('-')[1]}-${endDate.toString().split('-')[0]}-${endDate.toString().split('-')[2]}` : null;
      
      if (endDateFormatted) {
        queryStr.date = {
          $gte: new Date(startDateFormatted).toISOString(),
          $lt: moment(endDateFormatted).endOf('day').toDate().toISOString()
        };
      } else {
        queryStr.date = {
          $gte: new Date(startDateFormatted).toISOString()
        };
      }
    }

    const wb = XLSX.utils.book_new();
    const response = await EmployeeForm.find(queryStr).sort({ date: -1 });
    
    if (response) {
      const temp = JSON.stringify(response);
      const parsedData = JSON.parse(temp);
      const ws = XLSX.utils.json_to_sheet(parsedData);
      const down = path.join(__dirname, '../exportdata.xlsx');
      
      XLSX.utils.book_append_sheet(wb, ws, "sheet1");
      XLSX.writeFile(wb, down);
      
      res.download(down);
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};