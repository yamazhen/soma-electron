import { ipcMain } from "electron";
import { SecureStoreService } from "../service/secureStoreService";

export function setupSecureStoreHandlers() {
  const secureStoreService = new SecureStoreService();

  ipcMain.handle("secure:set", async (_event, key, value) => {
    return await secureStoreService.set(key, value);
  });

  ipcMain.handle("secure:get", async (_event, key) => {
    return await secureStoreService.get(key);
  });

  ipcMain.handle("secure:delete", async (_event, key) => {
    return await secureStoreService.delete(key);
  });
}
