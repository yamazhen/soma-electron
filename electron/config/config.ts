import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_NAME = process.env.SERVICE_NAME || "SomaElectron";
const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000";
const APP_ROOT = path.join(__dirname, "..");
const SQLITE_DEBUG = process.env.SQLITE_DEBUG || "false";
const NODE_ENV = process.env.NODE_ENV || "development";
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const MAIN_DIST = path.join(APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(APP_ROOT, "dist");
const VITE_PUBLIC = VITE_DEV_SERVER_URL
	? path.join(APP_ROOT, "public")
	: RENDERER_DIST;

export const env = {
	serviceName: SERVICE_NAME,
	preload: path.join(MAIN_DIST, "index.mjs"),
	appRoot: APP_ROOT,
	public: VITE_PUBLIC,
	mainDist: MAIN_DIST,
	rendererDist: RENDERER_DIST,
	viteDevServerUrl: VITE_DEV_SERVER_URL,
	nodeEnv: NODE_ENV,
	indexPath: path.join(RENDERER_DIST, "index.html"),
	gatewayUrl: GATEWAY_URL,
	sqliteDebug: SQLITE_DEBUG,
};
