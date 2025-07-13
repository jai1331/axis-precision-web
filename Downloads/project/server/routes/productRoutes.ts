import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardSummary
} from '../controllers/productController';

const router = express.Router();

router.get('/', getProducts);
router.get('/dashboard', getDashboardSummary);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;