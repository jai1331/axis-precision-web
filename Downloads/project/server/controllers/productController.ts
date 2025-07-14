import { Request, Response } from 'express';
import Product, { ProductDocument } from '../models/Product';

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ lastUpdated: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get a single product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Update a product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get dashboard summary
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();
    
    // Get products out of stock
    const outOfStock = await Product.countDocuments({ inStock: false });
    
    // Get products with low stock (quantity < 10)
    const lowStock = await Product.countDocuments({ quantity: { $lt: 10, $gt: 0 } });
    
    // Calculate total inventory value
    const products = await Product.find();
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    // Get category breakdown
    const categoryAggregation = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0,
        },
      },
    ]);
    
    // Get supplier breakdown
    const supplierAggregation = await Product.aggregate([
      {
        $group: {
          _id: '$supplier',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0,
        },
      },
    ]);

    // Get monthly trend data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await Product.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          products: { $sum: 1 },
          value: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          name: {
            $concat: [
              { $arrayElemAt: [['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], { $subtract: ['$_id.month', 1] }] },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          products: 1,
          value: 1,
          _id: 0
        }
      }
    ]);
    
    res.status(200).json({
      totalProducts,
      totalValue,
      outOfStock,
      lowStock,
      categoryBreakdown: categoryAggregation,
      supplierBreakdown: supplierAggregation,
      monthlyTrend
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};