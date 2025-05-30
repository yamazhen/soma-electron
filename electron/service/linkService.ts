import { BaseDAL } from "../database/dal/BaseDAL";
import path from "node:path";
import crypto from "node:crypto";

interface ParsedLink {
  text: string;
  targetName: string;
  start: number;
  end: number;
}

export class LinkService extends BaseDAL {
  private static readonly LINK_REGEX = /@@([^@\n]+)@@/g;

  parseLinks(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    let match;

    LinkService.LINK_REGEX.lastIndex = 0;

    while ((match = LinkService.LINK_REGEX.exec(content)) !== null) {
      links.push({
        text: match[0],
        targetName: match[1].trim(),
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return links;
  }

  private generateContentHash(content: string): string {
    return crypto.createHash("md5").update(content).digest("hex");
  }

  async updateNoteMeta(notePath: string, content: string): Promise<void> {
    const name = path.basename(notePath, ".md");
    const contentHash = this.generateContentHash(content);

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : name;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO note_metadata 
      (path, name, title, last_modified, content_hash)
      VALUES (?, ?, ?, datetime('now'), ?)
    `);

    stmt.run(notePath, name, title, contentHash);
  }

  async hasContentChanged(notePath: string, content: string): Promise<boolean> {
    const currentHash = this.generateContentHash(content);
    const stmt = this.db.prepare(`
      SELECT content_hash FROM note_metadata WHERE path = ?
    `);

    const result = stmt.get(notePath) as { content_hash: string } | undefined;
    return !result || result.content_hash !== currentHash;
  }

  async updateNoteLinks(sourcePath: string, content: string): Promise<void> {
    if (!(await this.hasContentChanged(sourcePath, content))) {
      return;
    }

    return this.transaction(() => {
      const deleteStmt = this.db.prepare(`
      DELETE FROM note_links WHERE source_path = ?
    `);
      deleteStmt.run(sourcePath);

      const links = this.parseLinks(content);
      if (links.length === 0) {
        this.updateNoteMeta(sourcePath, content);
        return;
      }

      const insertStmt = this.db.prepare(`
      INSERT INTO note_links 
      (source_path, target_note_name, link_text, position_start, position_end)
      VALUES (?, ?, ?, ?, ?)
    `);

      const sourceNoteName = path.basename(sourcePath, ".md");

      for (const link of links) {
        if (link.targetName === sourceNoteName) {
          continue;
        }

        insertStmt.run(
          sourcePath,
          link.targetName,
          link.text,
          link.start,
          link.end,
        );
      }

      this.updateNoteMeta(sourcePath, content);
    });
  }

  async resolveLinkTarget(targetName: string): Promise<string | null> {
    const stmt = this.db.prepare(`
      SELECT path FROM note_metadata 
      WHERE name = ? OR title = ?
      ORDER BY 
        CASE WHEN name = ? THEN 1 ELSE 2 END,
        last_modified DESC
      LIMIT 1
    `);

    const result = stmt.get(targetName, targetName, targetName) as
      | { path: string }
      | undefined;
    return result?.path || null;
  }

  async getBacklinks(notePath: string): Promise<
    Array<{
      sourcePath: string;
      sourceTitle: string;
      linkText: string;
      context?: string;
    }>
  > {
    const noteName = path.basename(notePath, ".md");

    const stmt = this.db.prepare(`
      SELECT 
        nl.source_path,
        nl.link_text,
        nm.title as source_title
      FROM note_links nl
      LEFT JOIN note_metadata nm ON nl.source_path = nm.path
      WHERE nl.target_note_name = ?
      ORDER BY nm.last_modified DESC
    `);

    return stmt.all(noteName) as Array<{
      sourcePath: string;
      sourceTitle: string;
      linkText: string;
    }>;
  }

  async getOutgoingLinks(sourcePath: string): Promise<
    Array<{
      targetName: string;
      targetPath?: string;
      linkText: string;
      resolved: boolean;
    }>
  > {
    const stmt = this.db.prepare(`
      SELECT 
        nl.target_note_name,
        nl.link_text,
        nm.path as target_path
      FROM note_links nl
      LEFT JOIN note_metadata nm ON nl.target_note_name = nm.name
      WHERE nl.source_path = ?
      ORDER BY nl.position_start
    `);

    const links = stmt.all(sourcePath) as Array<{
      target_note_name: string;
      link_text: string;
      target_path?: string;
    }>;

    return links.map((link) => ({
      targetName: link.target_note_name,
      targetPath: link.target_path,
      linkText: link.link_text,
      resolved: !!link.target_path,
    }));
  }

  async getAllNoteNames(): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT name FROM note_metadata 
      ORDER BY last_modified DESC
    `);

    return (stmt.all() as Array<{ name: string }>).map((row) => row.name);
  }

  async getLinkSuggestions(
    partialText: string,
    limit: number = 10,
  ): Promise<
    Array<{
      name: string;
      title: string;
      path: string;
    }>
  > {
    const searchTerm = `%${partialText}%`;

    const stmt = this.db.prepare(`
      SELECT name, title, path
      FROM note_metadata 
      WHERE name LIKE ? OR title LIKE ?
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1 
          WHEN title LIKE ? THEN 2 
          ELSE 3 
        END,
        length(name),
        last_modified DESC
      LIMIT ?
    `);

    return stmt.all(
      searchTerm,
      searchTerm,
      `${partialText}%`,
      `${partialText}%`,
      limit,
    ) as Array<{
      name: string;
      title: string;
      path: string;
    }>;
  }
}
