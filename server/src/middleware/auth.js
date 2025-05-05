
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', decodedToken.userId)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (user.is_blocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

const validateTelegramData = (req, res, next) => {
  try {
    // Here we would validate the Telegram initData
    // This is a simplification - actual validation would check the hash
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ message: 'Telegram initData required' });
    }
    
    // In a real implementation, verify the hash from Telegram
    // to ensure the data was not tampered with
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  validateTelegramData
};
