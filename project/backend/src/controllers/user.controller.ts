import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const allowedRoles = ['admin', 'management', 'warehouse_staff', 'production'];

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', allowedRoles)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError(error.message, 500);
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    next(error);
  }
};

export const createInternalUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      throw createError('Email, password, full name, and role are required', 400);
    }

    if (!allowedRoles.includes(role)) {
      throw createError('Invalid role provided', 400);
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError || !authData.user?.id) {
      throw createError(authError?.message || 'Failed to create internal user', 400);
    }

    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      password_hash: 'supabase_auth',
      role,
      is_active: true,
    });

    if (userError) {
      throw createError(`Failed to create user record: ${userError.message}`, 500);
    }

    res.status(201).json({
      success: true,
      data: {
        id: authData.user.id,
        email,
        full_name,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};
