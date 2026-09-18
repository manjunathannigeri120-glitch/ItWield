import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from '../middleware/auth';
import { getServiceSupabase } from '../db/supabaseClient';

vi.mock('../db/supabaseClient', () => ({
  getServiceSupabase: vi.fn(),
  getUserSupabase: vi.fn()
}));

describe('Auth Middleware', () => {
  it('rejects request with missing authorization header', async () => {
    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await requireAuth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid JWT token', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') });
    (getServiceSupabase as any).mockReturnValue({
      auth: { getUser: mockAuthGetUser }
    });

    const req: any = { headers: { authorization: 'Bearer invalid_token' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await requireAuth(req, res, next);
    
    expect(mockAuthGetUser).toHaveBeenCalledWith('invalid_token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows valid JWT and attaches user and client', async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({ 
      data: { user: { id: 'u123', email: 'test@test.com' } }, 
      error: null 
    });
    (getServiceSupabase as any).mockReturnValue({
      auth: { getUser: mockAuthGetUser }
    });

    const req: any = { headers: { authorization: 'Bearer valid_token' } };
    const res: any = { status: vi.fn(), json: vi.fn() };
    const next = vi.fn();

    await requireAuth(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'u123', email: 'test@test.com' });
    expect(req.jwt).toEqual('valid_token');
  });
});
