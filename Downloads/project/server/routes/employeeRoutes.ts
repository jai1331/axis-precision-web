import express from 'express';
import {
  createEmployeeEntry,
  getEmployeeData,
  updateEmployeeEntry,
  downloadExcel
} from '../controllers/employeeController';

const router = express.Router();

router.post('/employeeForm', createEmployeeEntry);
router.get('/getEmployeeData', getEmployeeData);
router.put('/updateEmployeeForm', updateEmployeeEntry);
router.get('/downloadExcel', downloadExcel);

export default router;