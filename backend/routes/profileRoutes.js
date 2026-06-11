import express from 'express';
import { pool } from '../config/postgres.js';
import Published from '../models/nosql/Published.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const STORAGE_PROFILES = path.resolve(__dirname, '../../storage/profiles');
if (!fs.existsSync(STORAGE_PROFILES)) {
  fs.mkdirSync(STORAGE_PROFILES, { recursive: true });
}

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (PNG, JPG, JPEG, WEBP) yang diizinkan.'), false);
    }
  }
}).single('avatar');

router.post('/upload-avatar', async (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    
    const userId = req.body.userId; 
    if (!req.file || !userId) {
      return res.status(400).json({ success: false, error: 'File atau User ID tidak ditemukan.' });
    }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileName = `profile_${userId}_${Date.now()}${ext}`; 
      const filePath = path.join(STORAGE_PROFILES, fileName);

      fs.writeFileSync(filePath, req.file.buffer);

      await pool.query(
        `UPDATE user_profiles SET avatar_url = $1 WHERE user_id = $2`,
        [fileName, userId]
      );

      res.json({ success: true, data: { avatar_url: fileName } });
    } catch (error) {
      console.error('[Upload Avatar Error]', error);
      res.status(500).json({ success: false, error: 'Gagal mengunggah foto profil.' });
    }
  });
});

router.put('/update', async (req, res) => {
  const { userId, username, display_name, bio, website_url, github_url, twitter_url } = req.body;

  if (!userId) return res.status(400).json({ success: false, error: 'User ID dibutuhkan.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (username) {
      const checkUser = await client.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (checkUser.rowCount > 0) {
        throw new Error('Username sudah digunakan oleh orang lain.');
      }
      await client.query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
    }

    await client.query(
      `UPDATE user_profiles 
       SET display_name = $1, bio = $2, website_url = $3, github_url = $4, twitter_url = $5 
       WHERE user_id = $6`,
      [display_name, bio, website_url, github_url, twitter_url, userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Profil berhasil diperbarui.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Update Profile Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memperbarui profil.' });
  } finally {
    client.release();
  }
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const profileQuery = `
      SELECT 
        u.id as user_id, 
        u.username, 
        p.display_name, 
        p.avatar_url, 
        p.bio, 
        p.website_url, 
        p.github_url, 
        p.twitter_url, 
        p.tags
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.username = $1
    `;
    
    const profileResult = await pool.query(profileQuery, [username]);

    if (profileResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const userProfile = profileResult.rows[0];

    const publishedGames = await Published.find({ ownerId: userProfile.user_id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        profile: userProfile,
        games: publishedGames
      }
    });

  } catch (error) {
    console.error('[Get Profile Error]', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;