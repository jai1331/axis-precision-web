import express from 'express';
import {
  getProductionRecords,
  getProductionRecordById,
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecord
} from '../controllers/productionController';

const router = express.Router();

router.get('/', getProductionRecords);
router.get('/:id', getProductionRecordById);
router.post('/', createProductionRecord);
router.put('/:id', updateProductionRecord);
router.delete('/:id', deleteProductionRecord);

export default router;