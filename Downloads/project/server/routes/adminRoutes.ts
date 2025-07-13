import express from 'express';
import {
  getAdminEntries,
  getAdminEntryById,
  createAdminEntry,
  updateAdminEntry,
  deleteAdminEntry,
  getCustomerList
} from '../controllers/adminController';

const router = express.Router();

// Admin entry routes
router.get('/', getAdminEntries);
router.get('/:id', getAdminEntryById);
router.post('/', createAdminEntry);
router.put('/:id', updateAdminEntry);
router.delete('/:id', deleteAdminEntry);

// Legacy routes to match your existing API
router.post('/saveAdminForm', createAdminEntry);
router.put('/updateAdmitEntryForm', updateAdminEntry);
router.get('/getCustomerList', getCustomerList);

export default router;