/**
 * Unified Storage - 统一的存储抽象层
 * 在 Node.js 环境中使用内存存储
 * 在浏览器环境中使用 IndexedDB
 */

export interface Module {
  id: string;
  appId: string;
  moduleId: string;
  code: string;
  dependencies: string[];
  exports: string[];
  timestamp: number;
}

export interface App {
  appId: string;
  appName: string;
  prompt: string;
  modules: Module[];
  orchestration: any;
  finalCode: string;
  timestamp: number;
}

export class UnifiedStorage {
  private storage: MemoryStorage | null = null;
  private isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      // 浏览器环境：使用 IndexedDB（TODO: 实现）
      console.log('[UnifiedStorage] Using IndexedDB (browser)');
      // throw new Error('IndexedDB support not yet implemented');
    } else {
      // Node.js 环境：使用内存存储
      this.storage = new MemoryStorage();
      console.log('[UnifiedStorage] Using MemoryStorage (Node.js)');
    }
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    if (this.storage && this.storage.init) {
      await this.storage.init();
    }
  }

  /**
   * 保存模块
   */
  async saveModule(module: Module): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.saveModule(module);
  }

  /**
   * 获取应用的所有模块
   */
  async getModules(appId: string): Promise<Module[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.getModules(appId);
  }

  /**
   * 获取单个模块
   */
  async getModule(appId: string, moduleId: string): Promise<Module | null> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.getModule(appId, moduleId);
  }

  /**
   * 保存或更新应用
   */
  async saveApp(app: App): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.saveApp(app);
  }

  /**
   * 获取应用
   */
  async getApp(appId: string): Promise<App | null> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.getApp(appId);
  }

  /**
   * 删除应用及其所有模块
   */
  async deleteApp(appId: string): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.deleteApp(appId);
  }

  /**
   * 获取最近的应用列表
   */
  async getRecentApps(limit: number = 10): Promise<App[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.getRecentApps(limit);
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    return this.storage.clear();
  }
}

/**
 * 内存存储（Node.js 环境）
 */
class MemoryStorage {
  private modules: Map<string, Module> = new Map();
  private apps: Map<string, App> = new Map();

  init(): Promise<void> {
    return Promise.resolve();
  }

  saveModule(module: Module): Promise<void> {
    this.modules.set(module.id, module);
    console.log(`[MemoryStorage] Module saved: ${module.moduleId}`);
    return Promise.resolve();
  }

  getModules(appId: string): Promise<Module[]> {
    const modules: Module[] = [];
    for (const [id, module] of this.modules.entries()) {
      if (module.appId === appId) {
        modules.push(module);
      }
    }
    console.log(`[MemoryStorage] Retrieved ${modules.length} modules for ${appId}`);
    return Promise.resolve(modules);
  }

  getModule(appId: string, moduleId: string): Promise<Module | null> {
    const id = `${appId}_${moduleId}`;
    const module = this.modules.get(id) || null;
    return Promise.resolve(module);
  }

  saveApp(app: App): Promise<void> {
    this.apps.set(app.appId, app);
    console.log(`[MemoryStorage] App saved: ${app.appId}`);
    return Promise.resolve();
  }

  getApp(appId: string): Promise<App | null> {
    return Promise.resolve(this.apps.get(appId) || null);
  }

  deleteApp(appId: string): Promise<void> {
    // 删除所有模块
    for (const [id, module] of this.modules.entries()) {
      if (module.appId === appId) {
        this.modules.delete(id);
      }
    }

    // 删除应用
    this.apps.delete(appId);
    console.log(`[MemoryStorage] App deleted: ${appId}`);
    return Promise.resolve();
  }

  getRecentApps(limit: number): Promise<App[]> {
    const apps = Array.from(this.apps.values());
    // 按时间戳排序（最新的在前）
    apps.sort((a, b) => b.timestamp - a.timestamp);
    return Promise.resolve(apps.slice(0, limit));
  }

  clear(): Promise<void> {
    this.modules.clear();
    this.apps.clear();
    console.log('[MemoryStorage] All data cleared');
    return Promise.resolve();
  }
}
