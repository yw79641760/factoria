/**
 * 内存存储（用于开发阶段，不依赖数据库）
 */

export interface AppRecord {
  id: string;
  user_id?: string;
  prompt: string;
  intent: any;
  code?: string;
  vercel_url?: string;
  status: 'generating' | 'deploying' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

class MemoryStorage {
  private apps: Map<string, AppRecord> = new Map();

  createApp(app: Omit<AppRecord, 'id' | 'created_at' | 'updated_at'>): AppRecord {
    const id = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newApp: AppRecord = {
      id,
      ...app,
      created_at: now,
      updated_at: now
    };
    this.apps.set(id, newApp);
    return newApp;
  }

  getApp(id: string): AppRecord | null {
    return this.apps.get(id) || null;
  }

  updateAppStatus(
    id: string,
    status: AppRecord['status'],
    updates?: Partial<AppRecord>
  ): AppRecord {
    const app = this.apps.get(id);
    if (!app) {
      throw new Error(`App ${id} not found`);
    }
    const updatedApp: AppRecord = {
      ...app,
      status,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  getUserApps(userId?: string, limit: number = 20): AppRecord[] {
    const allApps = Array.from(this.apps.values())
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (userId) {
      return allApps
        .filter(app => app.user_id === userId)
        .slice(0, limit);
    }
    return allApps.slice(0, limit);
  }
}

export const memoryStorage = new MemoryStorage();
