import express from 'express';
import bcrypt from 'bcrypt';
import { randomUUID, randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../config/postgres.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { sendOTPEmail } from '../services/email.js'; 

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_lupis_engine_super_aman_123';

const generateOTP = () => {
  return randomInt(100000, 999999).toString();
};

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Semua field harus diisi' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Cek apakah email sudah ada
    const existingUser = await client.query('SELECT id, verified FROM users WHERE email = $1', [email]);
    
    if (existingUser.rowCount > 0) {
      const user = existingUser.rows[0];
      
      if (user.verified) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Email sudah terdaftar dan aktif' });
      } else {
        // Hapus data lama (profile dihapus lebih dulu untuk menghindari error Foreign Key)
        await client.query('DELETE FROM user_profiles WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM users WHERE id = $1', [user.id]);
      }
    }

    const userId = randomUUID(); 
    const profileId = randomUUID();
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP & Set Timer 10 Menit
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client.query(
      `INSERT INTO users (id, username, email, password_hash, verified, otp_code, otp_expires_at) 
       VALUES ($1, $2, $3, $4, false, $5, $6)`,
      [userId, username, email, hashedPassword, hashedOtp, otpExpiresAt]
    );

    await client.query(
      `INSERT INTO user_profiles (id, user_id, display_name) 
       VALUES ($1, $2, $3)`,
      [profileId, userId, name]
    );

    await client.query('COMMIT');

    // Kirim email OTP
    const emailResult = await sendOTPEmail(email, name, otp);
    if (!emailResult.success) {
      console.error('[SES Error]', emailResult.error);
    }

    res.json({
      success: true,
      message: 'Registrasi berhasil. Silakan cek email Anda untuk kode OTP.',
      data: { email }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Register Error]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// 2. VERIFY OTP
// ==========================================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email dan OTP harus diisi' });
  }

  try {
    const userResult = await pool.query(
      `SELECT id, email, username, otp_code, otp_expires_at, verified 
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const user = userResult.rows[0];

    if (user.verified) {
      return res.status(400).json({ success: false, error: 'Akun sudah diverifikasi' });
    }

    // Cek Timer
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ success: false, error: 'Kode OTP sudah kadaluwarsa. Silakan minta ulang.' });
    }

    // Verifikasi Hash OTP
    const isOtpValid = await bcrypt.compare(otp, user.otp_code);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, error: 'Kode OTP tidak valid' });
    }

    // Aktifkan Akun & Bersihkan Data OTP
    await pool.query(
      `UPDATE users 
       SET verified = true, otp_code = NULL, otp_expires_at = NULL 
       WHERE id = $1`,
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      message: 'Akun berhasil diaktifkan',
      data: { 
        user: { id: user.id, email: user.email, username: user.username }, 
        token 
      }
    });
  } catch (error) {
    console.error('[Verify OTP Error]', error);
    res.status(500).json({ success: false, error: 'Gagal mengaktifkan akun' });
  }
});

// ==========================================
// 3. RESEND OTP
// ==========================================
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email harus diisi' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.verified, p.display_name 
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Email tidak ditemukan' });
    }

    const user = userResult.rows[0];

    if (user.verified) {
      return res.status(400).json({ success: false, error: 'Akun ini sudah diverifikasi. Silakan login.' });
    }

    // Generate OTP baru dan perbarui timer 10 menit dari sekarang
    const newOtp = generateOTP();
    const hashedOtp = await bcrypt.hash(newOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `UPDATE users 
       SET otp_code = $1, otp_expires_at = $2 
       WHERE id = $3`,
      [hashedOtp, otpExpiresAt, user.id]
    );

    // Gunakan display_name dari tabel user_profiles untuk email
    const name = user.display_name || 'User';
    const emailResult = await sendOTPEmail(email, name, newOtp);

    if (!emailResult.success) {
      console.error('[SES Error Resend]', emailResult.error);
      return res.status(500).json({ success: false, error: 'Gagal mengirim email OTP baru' });
    }

    res.json({ success: true, message: 'Kode OTP baru telah dikirim ke email Anda.' });

  } catch (error) {
    console.error('[Resend OTP Error]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 4. LOGIN
// ==========================================
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

    // Mencegah login jika akun belum diverifikasi
    if (!user.verified) {
      return res.status(403).json({ success: false, error: 'Akun belum diverifikasi. Silakan cek email Anda.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, error: 'Gunakan metode login Google/GitHub' });
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
    console.error('[Login Error]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 5. GET ME
// ==========================================
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
    console.error('[Get Me Error]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 6. GOOGLE AUTH (CUSTOM BUTTON - ACCESS TOKEN)
// ==========================================
// ==========================================
// 6. GOOGLE AUTH (CUSTOM BUTTON - ACCESS TOKEN & GOOGLE ID)
// ==========================================
router.post('/google', async (req, res) => {
  const { token } = req.body; 

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token Google tidak ditemukan' });
  }

  const client = await pool.connect();

  try {
    // 1. Ambil data dari Google API menggunakan Access Token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (!googleResponse.ok) {
      throw new Error('Gagal mengambil data dari Google. Token tidak valid.');
    }

    const payload = await googleResponse.json();
    
    // Ambil 'sub' dan ubah namanya menjadi 'googleId' untuk memudahkan
    const { email, name, picture, sub: googleId } = payload;

    if (!email || !googleId) {
       throw new Error('Email atau ID Google tidak ditemukan dari akun ini.');
    }

    await client.query('BEGIN');

    // 2. Cari pengguna berdasarkan google_id TERLEBIH DAHULU, lalu berdasarkan email
    const userLookup = await client.query(
      `SELECT u.id, u.email, u.google_id, u.username, u.verified, p.display_name, p.avatar_url 
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.google_id = $1 OR u.email = $2`, 
      [googleId, email]
    );

    let user;

    if (userLookup.rowCount > 0) {
      // PENGGUNA SUDAH ADA (Proses Login / Sinkronisasi)
      user = userLookup.rows[0];

      // a. Sinkronisasi: Jika mendaftar manual dulu (google_id masih kosong), isi sekarang
      if (!user.google_id) {
        await client.query(
          `UPDATE users SET google_id = $1 WHERE id = $2`, 
          [googleId, user.id]
        );
        user.google_id = googleId;
      }

      // b. Jika mendaftar manual tapi belum verifikasi OTP, aktifkan sekarang
      if (!user.verified) {
        await client.query(
          `UPDATE users 
           SET verified = true, otp_code = NULL, otp_expires_at = NULL 
           WHERE id = $1`, 
          [user.id]
        );
        user.verified = true;
      }
      
      // c. Update avatar jika di database belum ada foto profil
      if (!user.avatar_url && picture) {
        await client.query(
          `UPDATE user_profiles SET avatar_url = $1 WHERE user_id = $2`, 
          [picture, user.id]
        );
        user.avatar_url = picture;
      }

    } else {
      // PENGGUNA BARU (Proses Registrasi)
      const userId = randomUUID(); 
      const profileId = randomUUID();
      
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Insert ke tabel users, SEKARANG TERMASUK google_id
      await client.query(
        `INSERT INTO users (id, username, email, google_id, verified) 
         VALUES ($1, $2, $3, $4, true)`,
        [userId, username, email, googleId]
      );

      // Insert ke tabel user_profiles
      await client.query(
        `INSERT INTO user_profiles (id, user_id, display_name, avatar_url) 
         VALUES ($1, $2, $3, $4)`,
        [profileId, userId, name, picture]
      );

      user = { 
        id: userId, 
        email, 
        username, 
        google_id: googleId,
        verified: true, 
        display_name: name, 
        avatar_url: picture 
      };
    }

    await client.query('COMMIT');

    // 3. Buat dan kembalikan JWT Lokal
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Autentikasi Google berhasil',
      data: { user, token: jwtToken }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Google Auth Error]', error.message);
    res.status(401).json({ success: false, error: 'Autentikasi Google gagal: ' + error.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 7. GITHUB AUTH (OAUTH CODE FLOW)
// ==========================================
router.post('/github', async (req, res) => {
  const { code } = req.body; 

  if (!code) {
    return res.status(400).json({ success: false, error: 'Kode autentikasi GitHub tidak ditemukan' });
  }

  const client = await pool.connect();

  try {
    // 1. Tukar 'code' dari frontend dengan 'access_token' dari GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Gagal menukar kode dengan token GitHub.');
    }

    const accessToken = tokenData.access_token;

    // 2. Ambil data profil user menggunakan access_token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Gagal mengambil data profil dari GitHub.');
    }

    const githubUser = await userResponse.json();
    
    // 3. GitHub API tidak selalu mengembalikan email di /user jika diset private
    // Kita lakukan fetch tambahan ke endpoint /user/emails jika email kosong
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      const emails = await emailResponse.json();
      // Cari email utama yang sudah terverifikasi
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }

    const githubId = githubUser.id.toString();
    const name = githubUser.name || githubUser.login;
    const picture = githubUser.avatar_url;

    if (!email || !githubId) {
       throw new Error('Email atau ID GitHub tidak ditemukan dari akun ini.');
    }

    await client.query('BEGIN');

    // 4. Cari pengguna berdasarkan github_id TERLEBIH DAHULU, lalu berdasarkan email
    const userLookup = await client.query(
      `SELECT u.id, u.email, u.github_id, u.username, u.verified, p.display_name, p.avatar_url 
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.github_id = $1 OR u.email = $2`, 
      [githubId, email]
    );

    let user;

    if (userLookup.rowCount > 0) {
      // PENGGUNA SUDAH ADA (Proses Sinkronisasi)
      user = userLookup.rows[0];

      if (!user.github_id) {
        await client.query(
          `UPDATE users SET github_id = $1 WHERE id = $2`, 
          [githubId, user.id]
        );
        user.github_id = githubId;
      }

      if (!user.verified) {
        await client.query(
          `UPDATE users SET verified = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1`, 
          [user.id]
        );
        user.verified = true;
      }
      
      if (!user.avatar_url && picture) {
        await client.query(
          `UPDATE user_profiles SET avatar_url = $1 WHERE user_id = $2`, 
          [picture, user.id]
        );
        user.avatar_url = picture;
      }

    } else {
      // PENGGUNA BARU (Proses Registrasi)
      const userId = randomUUID(); 
      const profileId = randomUUID();
      
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Pastikan ada kolom github_id di tabel users
      await client.query(
        `INSERT INTO users (id, username, email, github_id, verified) 
         VALUES ($1, $2, $3, $4, true)`,
        [userId, username, email, githubId]
      );

      await client.query(
        `INSERT INTO user_profiles (id, user_id, display_name, avatar_url) 
         VALUES ($1, $2, $3, $4)`,
        [profileId, userId, name, picture]
      );

      user = { 
        id: userId, email, username, github_id: githubId,
        verified: true, display_name: name, avatar_url: picture 
      };
    }

    await client.query('COMMIT');

    // 5. Buat JWT Lokal
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Autentikasi GitHub berhasil',
      data: { user, token: jwtToken }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[GitHub Auth Error]', error.message);
    res.status(401).json({ success: false, error: 'Autentikasi GitHub gagal: ' + error.message });
  } finally {
    client.release();
  }
});

export default router;