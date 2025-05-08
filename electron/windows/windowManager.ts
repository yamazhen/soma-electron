import { BrowserWindow } from "electron";

class WindowManager {
  private windows: Map<string, BrowserWindow | null> = new Map();

  getWindow(id: string): BrowserWindow | null {
    return this.windows.get(id) || null;
  }

  setWindow(id: string, window: BrowserWindow | null): void {
    this.windows.set(id, window);
  }

  isWindowValid(id: string): boolean {
    const window = this.getWindow(id);
    return !!window && !window.isDestroyed();
  }

  closeAll(): void {
    for (const [id, window] of this.windows.entries()) {
      if (window && !window.isDestroyed()) {
        window.close();
      }
      this.windows.set(id, null);
    }
  }
}

export const windowManager = new WindowManager();
