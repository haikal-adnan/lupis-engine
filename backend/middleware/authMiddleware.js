import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_lupis_engine_super_aman_123';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Akses ditolak. Token autentikasi tidak ditemukan.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded; 
    
    next(); 
  } catch (err) {
    console.error('[Auth Middleware] Token Error:', err.message);
    return res.status(403).json({ 
      success: false, 
      error: 'Sesi tidak valid atau sudah kadaluwarsa. Silakan login kembali.' 
    });
  }
};