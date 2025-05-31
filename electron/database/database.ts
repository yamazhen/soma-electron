import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";
import BetterSqlite3 from "better-sqlite3";
import { env } from "../config/config";
import { extractErrorMessage } from "../utils/errorUtil";

const CURRENT_SCHEMA_VERSION = 1;

let db: Database | null = null;
const dbName = "soma.db";

export async function resetDatabase() {
  if (db) {
    db.close();
  }

  try {
    console.warn("Resetting database...");
    const dbPath = path.join(app.getPath("userData"), dbName);
    await unlink(dbPath);
  } catch (error) {
    throw new Error("Failed to reset database" + extractErrorMessage(error));
  }
}

export async function initDatabase(): Promise<Database | null> {
  if (!app.isReady()) {
    throw new Error("App is not ready");
  }
  if (db) {
    return db;
  }
  try {
    const dbPath = path.join(app.getPath("userData"), dbName);

    const isNewDatabase = !fs.existsSync(dbPath);

    const sqliteDb = new BetterSqlite3(dbPath, {
      verbose: process.env.SQLITE_DEBUG === "true" ? console.log : undefined,
    });
    db = {
      exec: (sql: string) => sqliteDb.exec(sql),
      prepare: (sql: string) => sqliteDb.prepare(sql) as Statement,
      transaction: sqliteDb.transaction.bind(sqliteDb),
      close: () => sqliteDb.close(),
    };

    db.exec("PRAGMA user_version = 1;");
    const schemaPath = path.join(
      app.getAppPath(),
      "electron/database/schema.sql",
    );
    const schema = fs.readFileSync(schemaPath, "utf-8");
    if (isNewDatabase) {
      db.exec("BEGIN TRANSACTION;");
      db.exec(schema);
      db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
      db.exec("COMMIT;");
    } else if (env.nodeEnv === "development") {
      db.exec("BEGIN TRANSACTION;");
      db.exec(schema);
      db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
      db.exec("COMMIT;");
    } else {
      await applyMigrations(db);
    }

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    return null;
  }
}

async function applyMigrations(db: Database): Promise<void> {
  const dbVersion = db.prepare("PRAGMA user_version").get().user_version;
  if (dbVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  const migrationsDir = path.join(
    app.getAppPath(),
    "electron/database/migrations",
  );

  if (!fs.existsSync(migrationsDir)) {
    try {
      fs.mkdirSync(migrationsDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create migrations directory:", error);
    }

    if (dbVersion < CURRENT_SCHEMA_VERSION) {
      db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
    }
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const versionMatch = migrationFile.match(/v(\d+)_/);
    if (!versionMatch) continue;

    const migrationVersion = Number.parseInt(versionMatch[1], 10);

    if (migrationVersion <= dbVersion) continue;

    if (migrationVersion > CURRENT_SCHEMA_VERSION) continue;

    const migrationPath = path.join(migrationsDir, migrationFile);
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    db.exec("BEGIN TRANSACTION;");
    try {
      db.exec(migrationSql);
      db.exec(`PRAGMA user_version = ${migrationVersion};`);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      console.error(`Error applying migration ${migrationFile}:`, error);
      throw error;
    }
  }

  if (dbVersion < CURRENT_SCHEMA_VERSION) {
    db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized");
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
