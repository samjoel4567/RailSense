import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rail_ai_sil4_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate signed JWT token for user
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

// ── POST /api/auth/signup ───────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An operator account with this email address already exists.'
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'CONTROL_ROOM',
      lastLogin: new Date()
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Operator account successfully registered.',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    console.error('[Auth Route Error - Signup]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during registration.'
    });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email (explicitly selecting password field)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or security key.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This operator account has been deactivated. Please contact network administrator.'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    console.error('[Auth Route Error - Login]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during authentication.'
    });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  // Stateless JWT logout (client discards token)
  return res.status(200).json({
    success: true,
    message: 'Operator session successfully terminated.'
  });
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toJSON()
  });
});

export default router;
