import { BaseDAL } from "./BaseDAL";

interface ActivityLogEntry {
  id?: number;
  type: "note" | "quiz" | "flashcard" | "note-edit";
  title: string;
  subtitle?: string;
  entity_id: string;
  timestamp: string;
  metadata?: string;
}

export class ActivityDAL extends BaseDAL {
  logActivity(activity: Omit<ActivityLogEntry, "id" | "timestamp">): number {
    const stmt = this.db.prepare(`
      INSERT INTO activity_log (type, title, subtitle, entity_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      activity.type,
      activity.title,
      activity.subtitle || null,
      activity.entity_id,
      activity.metadata || null,
    );

    return result.lastInsertRowid as number;
  }

  getRecentActivities(limit: number = 10): ActivityLogEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM activity_log 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    return stmt.all(limit) as ActivityLogEntry[];
  }

  clearOldActivities(daysToKeep: number = 30): number {
    const stmt = this.db.prepare(`
      DELETE FROM activity_log 
      WHERE datetime(timestamp) < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysToKeep);
    return result.changes;
  }
}
