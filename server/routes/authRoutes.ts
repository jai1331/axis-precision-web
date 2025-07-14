import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

// JWT Secret - same as React Native backend
const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk';

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
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
router.post('/register', async (req: Request, res: Response) => {
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
router.post('/change-password', async (req: Request, res: Response) => {
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

export default router; 