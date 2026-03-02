/**
 * BrowserFileStorage - 使用浏览器原生文件系统 API
 * 支持 Origin Private File System (OPFS) 和 IndexedDB 降级
 */

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
  createdAt: number;
  updatedAt: number;
}

export class BrowserFileStorage {
  private opfsRoot: FileSystemDirectoryHandle | null = null;
  private idb: IDBDatabase | null = null;
  private useOPFS: boolean = false;

  constructor() {
    this.useOPFS = 'showDirectoryPicker' in window;
  }

  /**
   * 初始化存储
   */
  async init(): Promise<void> {
    if (this.useOPFS) {
      try {
        this.opfsRoot = await navigator.storage.getDirectory();
        console.log('[BrowserFileStorage] Using OPFS');
      } catch (error) {
        console.warn('[BrowserFileStorage] OPFS not available, falling back to IndexedDB');
        this.useOPFS = false;
        await this.initIndexedDB();
      }
    } else {
      await this.initIndexedDB();
    }
  }

  /**
   * 初始化 IndexedDB（降级方案）
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('factoria-fs', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' });
        }
      };

      request.onsuccess = () => {
        this.idb = request.result;
        console.log('[BrowserFileStorage] Using IndexedDB');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 写入文件
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (this.useOPFS && this.opfsRoot) {
      await this.writeFileOPFS(path, content);
    } else if (this.idb) {
      await this.writeFileIDB(path, content);
    }
  }

  /**
   * 使用 OPFS 写入文件
   */
  private async writeFileOPFS(path: string, content: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let dirHandle = this.opfsRoot!;

    // 创建目录
    for (let i = 0; i < parts.length - 1; i++) {
      dirHandle = await dirHandle.getDirectoryHandle(parts[i], { create: true });
    }

    // 写入文件
    const fileName = parts[parts.length - 1];
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * 使用 IndexedDB 写入文件
   */
  private async writeFileIDB(path: string, content: string): Promise<void> {
    const transaction = this.idb!.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');

    const file: FileNode = {
      path,
      type: 'file',
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(file);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 读取文件
   */
  async readFile(path: string): Promise<string | null> {
    if (this.useOPFS && this.opfsRoot) {
      return this.readFileOPFS(path);
    } else if (this.idb) {
      return this.readFileIDB(path);
    }
    return null;
  }

  /**
   * 使用 OPFS 读取文件
   */
  private async readFileOPFS(path: string): Promise<string | null> {
    try {
      const parts = path.split('/').filter(Boolean);
      let dirHandle = this.opfsRoot!;

      // 导航到目录
      for (let i = 0; i < parts.length - 1; i++) {
        dirHandle = await dirHandle.getDirectoryHandle(parts[i]);
      }

      // 读取文件
      const fileName = parts[parts.length - 1];
      const fileHandle = await dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return file.text();
    } catch (error) {
      console.error(`[BrowserFileStorage] Failed to read ${path}:`, error);
      return null;
    }
  }

  /**
   * 使用 IndexedDB 读取文件
   */
  private async readFileIDB(path: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.idb!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(path);

      request.onsuccess = () => {
        const file = request.result as FileNode | undefined;
        resolve(file?.content || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<void> {
    if (this.useOPFS && this.opfsRoot) {
      await this.deleteFileOPFS(path);
    } else if (this.idb) {
      await this.deleteFileIDB(path);
    }
  }

  /**
   * 使用 OPFS 删除文件
   */
  private async deleteFileOPFS(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let dirHandle = this.opfsRoot!;

    // 导航到目录
    for (let i = 0; i < parts.length - 1; i++) {
      dirHandle = await dirHandle.getDirectoryHandle(parts[i]);
    }

    // 删除文件
    const fileName = parts[parts.length - 1];
    await dirHandle.removeEntry(fileName);
  }

  /**
   * 使用 IndexedDB 删除文件
   */
  private async deleteFileIDB(path: string): Promise<void> {
    const transaction = this.idb!.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');

    return new Promise((resolve, reject) => {
      const request = store.delete(path);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 列出目录
   */
  async listFiles(dirPath: string = '/'): Promise<string[]> {
    if (this.useOPFS && this.opfsRoot) {
      return this.listFilesOPFS(dirPath);
    } else if (this.idb) {
      return this.listFilesIDB(dirPath);
    }
    return [];
  }

  /**
   * 使用 OPFS 列出目录
   */
  private async listFilesOPFS(dirPath: string): Promise<string[]> {
    try {
      const parts = dirPath.split('/').filter(Boolean);
      let dirHandle = this.opfsRoot!;

      for (const part of parts) {
        dirHandle = await dirHandle.getDirectoryHandle(part);
      }

      const entries = [];
      for await (const entry of dirHandle.values()) {
        entries.push(entry.name);
      }

      return entries;
    } catch (error) {
      console.error(`[BrowserFileStorage] Failed to list ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * 使用 IndexedDB 列出目录
   */
  private async listFilesIDB(dirPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.idb!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as FileNode[];
        const prefix = dirPath === '/' ? '' : dirPath;
        const filtered = files
          .filter(f => f.path.startsWith(prefix))
          .map(f => f.path.substring(prefix.length + 1))
          .filter(name => !name.includes('/'));

        resolve(filtered);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 检查文件是否存在
   */
  async exists(path: string): Promise<boolean> {
    if (this.useOPFS && this.opfsRoot) {
      return this.existsOPFS(path);
    } else if (this.idb) {
      return this.existsIDB(path);
    }
    return false;
  }

  /**
   * 使用 OPFS 检查文件是否存在
   */
  private async existsOPFS(path: string): Promise<boolean> {
    try {
      return (await this.readFileOPFS(path)) !== null;
    } catch {
      return false;
    }
  }

  /**
   * 使用 IndexedDB 检查文件是否存在
   */
  private async existsIDB(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.idb!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(path);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
