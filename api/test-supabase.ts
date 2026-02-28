import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from './lib/database.js';

/**
 * GET /api/test-supabase
 * 测试Supabase连接
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET method is allowed' }
    });
  }

  try {
    console.log('[Supabase Test] Testing connection...');

    // 1. 测试基础连接
    const stats = await Database.getStats();
    console.log('[Supabase Test] Stats retrieved:', stats);

    // 2. 测试获取一个APP（如果有）
    const testApp = await Database.getApp('test-id');
    console.log('[Supabase Test] App retrieval result:', testApp ? 'Success' : 'Not found');

    return res.status(200).json({
      success: true,
      data: {
        status: 'connected',
        stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Supabase Test] Error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'SUPABASE_ERROR',
        message: error.message || 'Failed to connect to Supabase',
        details: error
      }
    });
  }
}
