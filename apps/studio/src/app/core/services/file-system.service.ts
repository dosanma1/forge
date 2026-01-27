import { Injectable, signal } from '@angular/core';

// Type declarations for File System Access API
// These are not included in standard TypeScript libs
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }
}

export interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  handle?: FileSystemHandle;
  children?: FileSystemEntry[];
}

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  private directoryHandle = signal<FileSystemDirectoryHandle | null>(null);
  private rootPath = signal<string>('');

  readonly currentDirectory = this.directoryHandle.asReadonly();
  readonly currentPath = this.rootPath.asReadonly();

  /**
   * Check if the File System Access API is supported
   */
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Opens a directory picker dialog and returns the selected directory handle
   */
  async openDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) {
      console.warn('File System Access API is not supported in this browser');
      return null;
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      this.directoryHandle.set(handle);
      this.rootPath.set(handle.name);

      return handle;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the picker
        return null;
      }
      throw error;
    }
  }

  /**
   * Reads the contents of a directory
   */
  async readDirectory(
    handle: FileSystemDirectoryHandle,
    path: string = '',
  ): Promise<FileSystemEntry[]> {
    const entries: FileSystemEntry[] = [];

    for await (const [name, entryHandle] of handle.entries()) {
      const entryPath = path ? `${path}/${name}` : name;
      const entry: FileSystemEntry = {
        name,
        path: entryPath,
        type: entryHandle.kind === 'directory' ? 'directory' : 'file',
        handle: entryHandle,
      };

      entries.push(entry);
    }

    // Sort: directories first, then files, alphabetically
    return entries.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Recursively reads a directory tree
   */
  async readDirectoryTree(
    handle: FileSystemDirectoryHandle,
    path: string = '',
    maxDepth: number = 3,
  ): Promise<FileSystemEntry[]> {
    if (maxDepth <= 0) {
      return this.readDirectory(handle, path);
    }

    const entries = await this.readDirectory(handle, path);

    for (const entry of entries) {
      if (entry.type === 'directory' && entry.handle) {
        entry.children = await this.readDirectoryTree(
          entry.handle as FileSystemDirectoryHandle,
          entry.path,
          maxDepth - 1,
        );
      }
    }

    return entries;
  }

  /**
   * Reads a file's content as text
   */
  async readFile(handle: FileSystemFileHandle): Promise<string> {
    const file = await handle.getFile();
    return file.text();
  }

  /**
   * Writes content to a file
   */
  async writeFile(handle: FileSystemFileHandle, content: string): Promise<void> {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Creates a new file in the given directory
   */
  async createFile(
    directoryHandle: FileSystemDirectoryHandle,
    fileName: string,
    content: string = '',
  ): Promise<FileSystemFileHandle> {
    const fileHandle = await directoryHandle.getFileHandle(fileName, {
      create: true,
    });
    if (content) {
      await this.writeFile(fileHandle, content);
    }
    return fileHandle;
  }

  /**
   * Creates a new directory
   */
  async createDirectory(
    parentHandle: FileSystemDirectoryHandle,
    directoryName: string,
  ): Promise<FileSystemDirectoryHandle> {
    return parentHandle.getDirectoryHandle(directoryName, { create: true });
  }

  /**
   * Clears the current directory handle
   */
  clear(): void {
    this.directoryHandle.set(null);
    this.rootPath.set('');
  }
}
