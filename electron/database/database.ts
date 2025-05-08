import { app } from "electron";
import { createRequire } from "module";
import fs from "fs";

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
    const schemaPath = path.join(
      app.getAppPath(),
      "electron/database/schema.sql",
    );
    const schema = fs.readFileSync(schemaPath, "utf-8");

    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });

    db.exec("BEGIN TRANSACTION;");
    db.exec(schema);
    db.exec("COMMIT;");

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    return null;
  }
}

export function getDatabase() {
  if (!db) {
    console.warn("Database not initialized.");
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    try {
      db.close();
      db = null;
    } catch (e) {
      console.error("Error closing database:", e);
    }
  }
}
