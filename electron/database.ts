import { app } from "electron";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let db: any = null;

export async function initDatabase() {
  if (!app.isReady()) {
    return null;
  }
  if (db) {
    return db;
  }
  try {
    const path = require("path");
    const Database = require("better-sqlite3");
    const dbPath = path.join(app.getPath("userData"), "local.db");
    db = new Database(dbPath);

    db.exec(`
    create table if not exists file_orders (
      file_path text primary key,
      parent_path text,
      order_index integer
    );
  `);

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    return null;
  }
}

export function getDatabase() {
  return db;
}
