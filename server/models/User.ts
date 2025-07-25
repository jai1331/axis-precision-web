import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { collection: 'users' }
);

const User = mongoose.model('user', userSchema);

export default User; 