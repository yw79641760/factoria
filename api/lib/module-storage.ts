/**
 * Module Storage - 使用 IndexedDB 存储生成的模块代码
 * 作为临时文件系统，支持模块的存储、检索和版本管理
 */

export interface Module {
  id: string;           // 模块唯一标识（appId_moduleId）
  appId: string;         // 所属应用 ID
  moduleId: string;      // 模块 ID（如 "storage", "form-input"）
  code: string;          // 模块代码
  dependencies: string[]; // 模块依赖的其他模块
  exports: string[];     // 模块对外暴露的接口
  timestamp: number;     // 生成时间戳
}

export interface App {
  appId: string;         // 应用 ID
  appName: string;       // 应用名称
  prompt: string;        // 用户原始需求
  modules: Module[];    // 模块列表
  orchestration: any;    // 能力编排结果
  finalCode: string;     // 最终整合的代码
  timestamp: number;     // 创建时间
}

export class ModuleStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'factoria-modules';
  private readonly DB_VERSION = 1;

  /**
   * 初始化 IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建 modules store
        if (!db.objectStoreNames.contains('modules')) {
          const moduleStore = db.createObjectStore('modules', { keyPath: 'id' });
          moduleStore.createIndex('appId', 'appId', { unique: false });
          moduleStore.createIndex('moduleId', 'moduleId', { unique: false });
        }

        // 创建 apps store
        if (!db.objectStoreNames.contains('apps')) {
          const appStore = db.createObjectStore('apps', { keyPath: 'appId' });
          appStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[ModuleStorage] IndexedDB initialized');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 保存模块
   */
  async saveModule(module: Module): Promise<void> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const transaction = this.db.transaction(['modules'], 'readwrite');
    const store = transaction.objectStore('modules');

    return new Promise((resolve, reject) => {
      const request = store.put(module);
      request.onsuccess = () => {
        console.log(`[ModuleStorage] Module saved: ${module.moduleId}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取应用的所有模块
   */
  async getModules(appId: string): Promise<Module[]> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const transaction = this.db.transaction(['modules'], 'readonly');
    const store = transaction.objectStore('modules');
    const index = store.index('appId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(appId);
      request.onsuccess = () => {
        console.log(`[ModuleStorage] Retrieved ${request.result.length} modules for ${appId}`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取单个模块
   */
  async getModule(appId: string, moduleId: string): Promise<Module | null> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const transaction = this.db.transaction(['modules'], 'readonly');
    const store = transaction.objectStore('modules');

    return new Promise((resolve, reject) => {
      const request = store.get(`${appId}_${moduleId}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 保存或更新应用
   */
  async saveApp(app: App): Promise<void> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const transaction = this.db.transaction(['apps'], 'readwrite');
    const store = transaction.objectStore('apps');

    return new Promise((resolve, reject) => {
      const request = store.put(app);
      request.onsuccess = () => {
        console.log(`[ModuleStorage] App saved: ${app.appId}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取应用
   */
  async getApp(appId: string): Promise<App | null> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const transaction = this.db.transaction(['apps'], 'readonly');
    const store = transaction.objectStore('apps');

    return new Promise((resolve, reject) => {
      const request = store.get(appId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除应用及其所有模块
   */
  async deleteApp(appId: string): Promise<void> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const modules = await this.getModules(appId);

    // 删除所有模块
    const moduleTransaction = this.db.transaction(['modules'], 'readwrite');
    const moduleStore = moduleTransaction.objectStore('modules');
    for (const module of modules) {
      moduleStore.delete(module.id);
    }

    // 删除应用
    const appTransaction = this.db.transaction(['apps'], 'readwrite');
    const appStore = appTransaction.objectStore('apps');
    appStore.delete(appId);

    console.log(`[ModuleStorage] App deleted: ${appId}`);
  }

  /**
   * 获取最近的应用列表
   */
  async getRecentApps(limit: number = 10): Promise<App[]> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const transaction = this.db.transaction(['apps'], 'readonly');
    const store = transaction.objectStore('apps');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results: App[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('ModuleStorage not initialized');
    }

    const moduleTransaction = this.db.transaction(['modules'], 'readwrite');
    const appTransaction = this.db.transaction(['apps'], 'readwrite');

    moduleTransaction.objectStore('modules').clear();
    appTransaction.objectStore('apps').clear();

    console.log('[ModuleStorage] All data cleared');
  }
}
