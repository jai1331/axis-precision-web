import { Request, Response } from 'express';
import AdminEntry, { AdminEntryDocument } from '../models/AdminEntry';
import moment from 'moment';

// Get all admin entries with filtering and sorting
export const getAdminEntries = async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      sortBy = 'dateOfEntry',
      sortOrder = 'desc',
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build search query
    const searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { componentName: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { machineName: { $regex: search, $options: 'i' } },
        { dcno: { $regex: search, $options: 'i' } }
      ];
    }

    // Add date range filter
    if (startDate || endDate) {
      searchQuery.dateOfEntry = {};
      if (startDate) {
        const startDateFormatted = `${startDate.toString().split('-')[1]}-${startDate.toString().split('-')[0]}-${startDate.toString().split('-')[2]}`;
        searchQuery.dateOfEntry.$gte = new Date(startDateFormatted).toISOString();
      }
      if (endDate) {
        const endDateFormatted = `${endDate.toString().split('-')[1]}-${endDate.toString().split('-')[0]}-${endDate.toString().split('-')[2]}`;
        searchQuery.dateOfEntry.$lt = moment(endDateFormatted).endOf('day').toDate().toISOString();
      }
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get entries with pagination
    const entries = await AdminEntry.find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalEntries = await AdminEntry.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalEntries / Number(limit));

    res.status(200).json({
      entries,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalEntries,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get a single admin entry by ID
export const getAdminEntryById = async (req: Request, res: Response) => {
  try {
    const entry = await AdminEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Admin entry not found' });
    }
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Create a new admin entry (saveAdminForm endpoint)
export const createAdminEntry = async (req: Request, res: Response) => {
  try {
    const entry = new AdminEntry(req.body);
    const savedEntry = await entry.save();
    res.status(201).json({ status: 'ok', response: savedEntry });
  } catch (error) {
    res.status(400).json({ status: 'error', error: 'Unable to save' });
  }
};

// Update an admin entry (updateAdmitEntryForm endpoint)
export const updateAdminEntry = async (req: Request, res: Response) => {
  try {
    const { id, ...updateData } = req.body;
    const entryId = id || req.params.id;
    
    const updatedEntry = await AdminEntry.findByIdAndUpdate(
      entryId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Admin entry not found' });
    }
    
    res.status(200).json({ status: 'ok', response: updatedEntry });
  } catch (error) {
    res.status(400).json({ status: 'error', error: 'Unable to update' });
  }
};

// Delete an admin entry
export const deleteAdminEntry = async (req: Request, res: Response) => {
  try {
    const entry = await AdminEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Admin entry not found' });
    }
    res.status(200).json({ message: 'Admin entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get customer list (getCustomerList endpoint)
export const getCustomerList = async (req: Request, res: Response) => {
  try {
    const customers = await AdminEntry.find({});
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};