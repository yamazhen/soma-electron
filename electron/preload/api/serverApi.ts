import { ipcRenderer } from "electron";

export const serverApi = {
  get: (endpoint: string, options: any) =>
    ipcRenderer.invoke("api:get", endpoint, options),
  post: (endpoint: string, data: any, options: any) =>
    ipcRenderer.invoke("api:post", endpoint, data, options),
  put: (endpoint: string, data: any, options: any) =>
    ipcRenderer.invoke("api:put", endpoint, data, options),
  delete: (endpoint: string, options = {}) =>
    ipcRenderer.invoke("api:delete", endpoint, options),
};
