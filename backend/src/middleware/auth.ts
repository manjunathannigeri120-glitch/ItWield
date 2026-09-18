import { Request, Response, NextFunction } from 'express';
import { getServiceSupabase, getUserSupabase } from '../db/supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  jwt?: string;
  supabase?: SupabaseClient | null;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const serviceClient = getServiceSupabase();

  if (!serviceClient) {
    // Development mode fallback if no Supabase configured
    console.warn('No Supabase client configured. Mocking auth for development.');
    req.user = { id: 'mock-user-id', email: 'mock@example.com' };
    req.jwt = 'mock-jwt';
    req.supabase = null;
    return next();
  }

  try {
    const { data: { user }, error } = await serviceClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { id: user.id, email: user.email };
    req.jwt = token;
    req.supabase = getUserSupabase(token);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
