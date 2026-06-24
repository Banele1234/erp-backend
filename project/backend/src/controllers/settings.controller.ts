import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

// The single settings row ID
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/v1/settings
export const getSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', SETTINGS_ID)
      .single();

    if (error) {
      // If no row exists, create one with defaults
      if (error.code === 'PGRST116') {
        const defaultData = {
          language: 'en-US',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          emailAlerts: true,
          smsAlerts: false,
          inventoryWarnings: true,
          twoFactor: false,
          passwordPolicy: 'strong',
          sessionTimeout: 30,
        };
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert({ id: SETTINGS_ID, data: defaultData })
          .select('data')
          .single();

        if (insertError) throw insertError;
        return res.json({ success: true, data: newData.data });
      }
      throw error;
    }

    res.json({ success: true, data: data.data });
  } catch (error) {
    console.error('Get settings error:', error);
    next(createError('Failed to fetch settings', 500));
  }
};

// PUT /api/v1/settings
export const updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const newData = req.body;

    // Validate that we have at least some keys
    if (!newData || typeof newData !== 'object') {
      throw createError('Invalid settings data', 400);
    }

    // First, get the current settings to merge (or just replace)
    const { data: current, error: fetchError } = await supabase
      .from('settings')
      .select('data')
      .eq('id', SETTINGS_ID)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const mergedData = current ? { ...current.data, ...newData } : newData;

    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: SETTINGS_ID, data: mergedData })
      .select('data')
      .single();

    if (error) throw error;

    res.json({ success: true, data: data.data });
  } catch (error) {
    console.error('Update settings error:', error);
    next(createError('Failed to update settings', 500));
  }
};