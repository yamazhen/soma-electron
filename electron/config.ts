import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.join(__dirname, "..");
export const NODE_ENV = process.env.NODE_ENV || "development";
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(APP_ROOT, "dist");
export const VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(APP_ROOT, "public")
  : RENDERER_DIST;

export const env = {
  preload: path.join(__dirname, "preload.mjs"),
  appRoot: APP_ROOT,
  public: VITE_PUBLIC,
  mainDist: MAIN_DIST,
  rendererDist: RENDERER_DIST,
  viteDevServerUrl: VITE_DEV_SERVER_URL,
  nodeEnv: NODE_ENV,
};
