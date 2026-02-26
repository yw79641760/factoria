import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 类型定义
export interface App {
  id: string;
  user_id?: string;
  prompt: string;
  intent: Intent;
  template: string;
  code: string;
  vercel_url?: string;
  vercel_project_id?: string;
  status: 'generating' | 'deploying' | 'ready' | 'failed' | 'expired';
  created_at: string;
  updated_at: string;
  deploy_time?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Intent {
  type: 'tracker' | 'todo' | 'calculator' | 'countdown' | 'notes';
  name: string;
  description?: string;
  fields?: Field[];
  features?: string[];
  confidence?: number;
}

export interface Field {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  defaultValue?: any;
  placeholder?: string;
}

// 数据库操作
export class Database {
  /**
   * 创建新APP记录
   */
  static async createApp(app: Omit<App, 'id' | 'created_at' | 'updated_at'>): Promise<App> {
    const { data, error } = await supabase
      .from('apps')
      .insert(app)
      .select()
      .single();

    if (error) {
      console.error('Error creating app:', error);
      throw error;
    }

    return data;
  }

  /**
   * 获取APP
   */
  static async getApp(id: string): Promise<App | null> {
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error getting app:', error);
      throw error;
    }

    return data;
  }

  /**
   * 更新APP状态
   */
  static async updateAppStatus(
    id: string,
    status: App['status'],
    updates?: Partial<App>
  ): Promise<App> {
    const { data, error } = await supabase
      .from('apps')
      .update({ status, ...updates })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating app:', error);
      throw error;
    }

    return data;
  }

  /**
   * 获取用户APP列表
   */
  static async getUserApps(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<App[]> {
    const { data, error } = await supabase
      .from('apps')
      .select('id, prompt, template, vercel_url, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting user apps:', error);
      throw error;
    }

    return data;
  }

  /**
   * 获取APP统计
   */
  static async getStats(): Promise<any> {
    const { data, error } = await supabase
      .from('apps')
      .select('status, template, intent->type');

    if (error) {
      console.error('Error getting stats:', error);
      throw error;
    }

    return {
      total: data.length,
      byStatus: data.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTemplate: data.reduce((acc, app) => {
        acc[app.template] = (acc[app.template] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}
