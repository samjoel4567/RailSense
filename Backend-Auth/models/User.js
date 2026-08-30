import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const VALID_ROLES = ['LOCO_PILOT', 'STATION_MASTER', 'CONTROL_ROOM', 'ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [64, 'Name cannot exceed 64 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Exclude by default in queries
    },
    role: {
      type: String,
      enum: {
        values: VALID_ROLES,
        message: '{VALUE} is not a valid operator role'
      },
      default: 'CONTROL_ROOM'
    },
    badgeNumber: {
      type: String,
      default: () => `RAIL-${Math.floor(1000 + Math.random() * 9000)}`
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Format JSON response to exclude sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return {
    id: obj._id,
    name: obj.name,
    email: obj.email,
    role: obj.role,
    badgeNumber: obj.badgeNumber,
    isActive: obj.isActive,
    lastLogin: obj.lastLogin,
    createdAt: obj.createdAt
  };
};

export default mongoose.model('User', userSchema);
