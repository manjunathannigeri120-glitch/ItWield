import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Hardcoded SuperAdmin Email Guarantee
  const SUPERADMIN_EMAIL = 'manjunathannigeri120@gmail.com';

  if (!req.user || !req.user.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.user?.email || !req.user.email.toLowerCase().includes('manjunathannigeri120')) {
    console.warn(`[SECURITY] Unauthorized admin access attempt by ${req.user.email} (IP: ${req.ip})`);
    return res.status(403).json({ error: 'Forbidden: God-Mode access required' });
  }

  next();
};



