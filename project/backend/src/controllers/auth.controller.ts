import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !users) {
      throw createError('Invalid credentials', 401);
    }

    // In production, you would verify the password hash
    // For now, we'll use Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw createError('Invalid credentials', 401);
    }

    // Get customer data if user is a customer
    let customer = null;
    if (users.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', users.id)
        .single();
      customer = customerData;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: users.id,
        email: users.email,
        role: users.role,
        customerId: customer?.id,
      } as object,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: users.id,
          email: users.email,
          full_name: users.full_name,
          role: users.role,
        },
        customer: customer ? {
          id: customer.id,
          company_name: customer.company_name,
          customer_code: customer.customer_code,
          rating: customer.rating,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, full_name, company_name, phone, customer_type, address, city, state, pincode, gst_number } = req.body;

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw createError(authError.message, 400);
    }

    // Create user record
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user?.id,
      email,
      full_name,
      password_hash: 'supabase_auth',
      role: 'customer',
      is_active: true,
    });

    if (userError) {
      throw createError('Failed to create user', 500);
    }

    // Create customer record
    const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        user_id: authData.user?.id,
        customer_code: customerCode,
        company_name,
        contact_person: full_name,
        phone,
        address,
        city,
        state,
        pincode,
        gst_number,
        customer_type: customer_type || 'regular_dealer',
        rating: 'bronze',
        credit_limit: 100000,
        country: 'India',
      })
      .select()
      .single();

    if (customerError) {
      throw createError('Failed to create customer', 500);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: authData.user?.id,
        email,
        role: 'customer',
        customerId: customerData.id,
      } as object,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: authData.user?.id,
          email,
          full_name,
          role: 'customer',
        },
        customer: customerData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user?.userId)
      .single();

    if (!user) {
      throw createError('User not found', 404);
    }

    let customer = null;
    if (user.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      customer = customerData;
    }

    res.json({
      success: true,
      data: { user, customer },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw createError('Failed to refresh token', 401);
    }

    const token = jwt.sign(
      {
        userId: data.user?.id,
        email: data.user?.email,
        role: req.user?.role,
        customerId: req.user?.customerId,
      } as object,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};
