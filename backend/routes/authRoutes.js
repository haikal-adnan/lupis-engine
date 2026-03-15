import express from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../config/postgres.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_lupis_engine_super_aman_123';

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Semua field harus diisi' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Email sudah terdaftar' });
    }

    const userId = randomUUID(); 
    const profileId = randomUUID();
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (id, username, email, password_hash, verified) 
       VALUES ($1, $2, $3, $4, false)`,
      [userId, username, email, hashedPassword]
    );

    await client.query(
      `INSERT INTO user_profiles (id, user_id, display_name) 
       VALUES ($1, $2, $3)`,
      [profileId, userId, name]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Registrasi berhasil',
      data: { email }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email dan OTP harus diisi' });
  }

  if (otp !== '123456') {
    return res.status(400).json({ success: false, error: 'Kode OTP tidak valid' });
  }

  try {
    const userResult = await pool.query(
      `SELECT id, email, username FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const user = userResult.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      message: 'Akun berhasil diaktifkan',
      data: { user, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengaktifkan akun' });
  }
});

router.post('/cancel-registration', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false });

  try {
    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email dan password harus diisi' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.username, u.password_hash, u.verified, p.display_name, p.avatar_url 
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.email = $1`, 
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ success: false, error: 'Email atau password salah' });
    }

    const user = userResult.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ 
        success: false, 
        error: 'Gunakan metode login Google/GitHub' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    delete user.password_hash;

    res.json({
      success: true,
      data: { user, token }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.username, u.verified, p.display_name, p.avatar_url 
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.id = $1`, 
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      data: { user: userResult.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;