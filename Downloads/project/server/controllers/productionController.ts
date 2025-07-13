import { Request, Response } from 'express';
import ProductionRecord, { ProductionRecordDocument } from '../models/ProductionRecord';

// Get all production records with filtering and sorting
export const getProductionRecords = async (req: Request, res: Response) => {
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
        { machineName: { $regex: search, $options: 'i' } }
      ];
    }

    // Add date range filter
    if (startDate || endDate) {
      searchQuery.dateOfEntry = {};
      if (startDate) {
        searchQuery.dateOfEntry.$gte = new Date(startDate as string);
      }
      if (endDate) {
        searchQuery.dateOfEntry.$lte = new Date(endDate as string);
      }
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get records with pagination
    const records = await ProductionRecord.find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalRecords = await ProductionRecord.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalRecords / Number(limit));

    res.status(200).json({
      records,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single production record by ID
export const getProductionRecordById = async (req: Request, res: Response) => {
  try {
    const record = await ProductionRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Production record not found' });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new production record
export const createProductionRecord = async (req: Request, res: Response) => {
  try {
    const record = new ProductionRecord(req.body);
    const savedRecord = await record.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a production record
export const updateProductionRecord = async (req: Request, res: Response) => {
  try {
    const updatedRecord = await ProductionRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Production record not found' });
    }
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a production record
export const deleteProductionRecord = async (req: Request, res: Response) => {
  try {
    const record = await ProductionRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Production record not found' });
    }
    res.status(200).json({ message: 'Production record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};