import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import XLSX from 'xlsx';
import path from 'path';
import productRoutes from './routes/productRoutes';
import productionRoutes from './routes/productionRoutes';
import adminRoutes from './routes/adminRoutes';
import employeeRoutes from './routes/employeeRoutes';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// JWT Secret - same as React Native backend
const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database connection - same MongoDB URI as React Native backend
const connectDB = async () => {
  try {
    const password = 'IronMan';
    const mongoUri = `mongodb+srv://admin:${password}@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority`;
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
};

// Import models
import User from './models/User';
import AdminEntryForm from './models/AdminEntryForm';
import EmployeeForm from './models/EmployeeForm';

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ status: 'error', error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/products', productRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', employeeRoutes);
app.use('/api/auth', authRoutes);

// Legacy API routes for compatibility with React Native app
// Login endpoint
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();
  console.log("User Details app", username, password, user);
  
  if (!user) {
    return res.json({ status: 'error', error: 'Invalid username/password' });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username
      },
      JWT_SECRET
    );

    return res.json({ status: 'ok', data: token, user: user.username });
  }
  res.json({ status: 'error', error: 'Invalid username/password' });
});

// Register endpoint
app.post('/api/register', async (req: Request, res: Response) => {
  console.log('req', req.body);
  const { username, password: plainTextPassword } = req.body;
  
  if (!username || typeof username !== 'string') {
    return res.json({ status: 'error', error: 'Invalid username' });
  }

  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    return res.json({ status: 'error', error: 'Invalid password' });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: 'error',
      error: 'Password too small. Should be atleast 6 characters'
    });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);
  console.log('password hashed ', password);
  
  try {
    const response = await User.create({
      username,
      password
    });
    console.log('User created successfully: ', response);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.json({ status: 'error', error: 'Username already in use' });
    }
    throw error;
  }

  res.json({ status: 'ok' });
});

// Change password endpoint
app.post('/api/change-password', async (req: Request, res: Response) => {
  const { token, newpassword: plainTextPassword } = req.body;

  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    return res.json({ status: 'error', error: 'Invalid password' });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: 'error',
      error: 'Password too small. Should be atleast 6 characters'
    });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    const _id = user.id;
    const password = await bcrypt.hash(plainTextPassword, 10);

    await User.updateOne(
      { _id },
      {
        $set: { password }
      }
    );
    res.json({ status: 'ok' });
  } catch (error) {
    console.log(error);
    res.json({ status: 'error', error: ';))' });
  }
});

// Save admin form endpoint
app.post('/api/saveAdminForm', async (req: Request, res: Response) => {
  const { customerName, componentName, qty, dcno, internalJobOrder } = req.body;
  console.log(req.body);
  
  try {
    const response = await AdminEntryForm.create({
      customerName,
      componentName,
      qty,
      dcno,
      internalJobOrder
    });
    return res.json({ status: 'ok', response: response });
  } catch (err) {
    return res.json({ status: 'error', error: 'Unable to save' });
  }
});

// Employee form endpoint
app.post('/api/employeeForm', async (req: Request, res: Response) => {
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
    remarks
  } = req.body;
  
  let finalDate = date;
  if (String(date).includes('T')) {
    finalDate = date;
  } else {
    let startDateFormatted = `${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`;
    finalDate = new Date(startDateFormatted).toISOString();
  }

  console.log('date', date, 'moment', finalDate);
  
  try {
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
      remarks 
    });
    console.log('employeeForm saved successfully: ', response);
    
    if (response) { 
      return res.json({ status: 'ok', response: response });
    }
  } catch (err) {
    return res.json({ status: 'error', error: 'Unable to save' });
  }
});

// Get employee data endpoint
app.get('/api/getEmployeeData', async (req: Request, res: Response) => {
  console.log('get call', req.query);
  const { startDate, endDate } = req.query;
  console.log('req.query', req.query);
  console.log(moment(new Date(startDate as string)).format('DD-MM-YYYY'), moment(new Date(endDate as string)).format('DD-MM-YYYY'), 'endDate', moment(endDate as string), 'n', `${(endDate as string).split('-')[1]}-${(endDate as string).split('-')[0]}-${(endDate as string).split('-')[2]}`);
  
  try {
    let response;
    let endDateFormatted = `${(endDate as string).split('-')[1]}-${(endDate as string).split('-')[0]}-${(endDate as string).split('-')[2]}`;
    let startDateFormatted = `${(startDate as string).split('-')[1]}-${(startDate as string).split('-')[0]}-${(startDate as string).split('-')[2]}`;
    
    console.log("start date", String(startDate) === String(endDate), 'endDate', 
      endDate, moment(endDate as string).endOf('day').toDate(), 'endDateFormatted', moment(endDateFormatted).endOf('day').toDate(),
      'startDateFormatted', startDateFormatted, moment(startDateFormatted).format('MM-DD-YYYY'), 'j', moment(startDateFormatted).startOf('day').toDate(),
      'new Date', moment(endDateFormatted).endOf('day').toDate().toISOString()
    );
    
    let queryStr: any = {
      "date": {
        "$lt": moment(endDateFormatted).endOf('day').toDate().toISOString()
      }
    };
    
    if (req.query.startDate && (String(startDate) !== String(endDate))) {
      queryStr = {
        "date": {
          "$gte": new Date(startDateFormatted).toISOString(),
          "$lt": moment(endDateFormatted).endOf('day').toDate().toISOString()
        }
      };
    }
    
    console.log('queryStr', queryStr);
    response = await EmployeeForm.find(queryStr).sort({ date: -1 });
    
    if (response) {
      console.log('response', response, response.length);
      return res.json(response);
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get customer list endpoint
app.get('/api/getCustomerList', async (req: Request, res: Response) => {
  console.log('get call cus');
  
  try {
    const response = await AdminEntryForm.find({});
    if (response) {
      console.log('response', response, response.length);
      return res.json(response);
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update admin entry form endpoint
app.put('/api/updateAdmitEntryForm', async (req: Request, res: Response) => {
  console.log('req', req.body);
  
  try {
    const response = await AdminEntryForm.findOneAndUpdate({ _id: req.body.id }, req.body, { new: true });
    if (response) {
      console.log('response', response);
      return res.json({ status: 'ok', response: response });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update employee form endpoint
app.put('/api/updateEmployeeForm', async (req: Request, res: Response) => {
  console.log(req.body, 'req');
  let finalDate = req.body.date;
  
  if (String(req.body.date).includes('T')) {
    finalDate = req.body.date;
  } else {
    let startDateFormatted = `${req.body.date.split('-')[1]}-${req.body.date.split('-')[0]}-${req.body.date.split('-')[2]}`;
    finalDate = new Date(startDateFormatted).toISOString();
  }

  console.log('date', req.body.date, 'moment', finalDate);
  req.body.date = finalDate;
  console.log('date after', req.body.date);
  
  try {
    const response = await EmployeeForm.findOneAndUpdate({ _id: req.body.id }, req.body, { new: true });
    if (response) {
      console.log('response', response);
      return res.json({ status: 'ok', response: response });
    }
  } catch (err: any) {
    console.log('err', err);
    res.status(500).json({ message: err.message });
  }
});

// Download Excel endpoint
app.get('/api/downloadExcel', async (req: Request, res: Response) => {
  console.log('get call', req.query);
  const { startDate, endDate } = req.query;
  
  try {
    let response;
    let endDateFormatted = `${(endDate as string).split('-')[1]}-${(endDate as string).split('-')[0]}-${(endDate as string).split('-')[2]}`;
    let startDateFormatted = `${(startDate as string).split('-')[1]}-${(startDate as string).split('-')[0]}-${(startDate as string).split('-')[2]}`;
    
    let queryStr: any = {
      "date": {
        "$lt": moment(endDateFormatted).endOf('day').toDate().toISOString()
      }
    };
    
    if (req.query.startDate && (String(startDate) !== String(endDate))) {
      queryStr = {
        "date": {
          "$gte": new Date(startDateFormatted).toISOString(),
          "$lt": moment(endDateFormatted).endOf('day').toDate().toISOString()
        }
      };
    }
    
    console.log('queryStr', queryStr);
    var wb = XLSX.utils.book_new(); 
    response = await EmployeeForm.find(queryStr).sort({ date: -1 });
    
    if (response) {
      console.log('response', response.length);
      var temp = JSON.stringify(response);
      temp = JSON.parse(temp);
      var ws = XLSX.utils.json_to_sheet(temp);
      var down = path.join(__dirname, 'exportdata.xlsx');
      XLSX.utils.book_append_sheet(wb, ws, "sheet1");
      XLSX.writeFile(wb, down);
      res.download(down);
      console.log('ws', ws, 'res', res);
      return res;
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;