import { BaseDAL } from "../database/dal/BaseDAL";
import path from "node:path";
import crypto from "node:crypto";

interface ParsedLink {
	text: string;
	targetName: string;
	start: number;
	end: number;
}

interface NoteLink {
	id?: number;
	sourcePath: string;
	targetNoteName: string;
	targetPath?: string;
	linkText: string;
	positionStart: number;
	positionEnd: number;
}

interface NoteMeta {
	path: string;
	name: string;
	title?: string;
	lastModified: Date;
	contentHash: string;
}

export class LinkService extends BaseDAL {
	private static readonly LINK_REGEX = /@@([^@\n]+)@@/g;

	// Parse links from content
	parseLinks(content: string): ParsedLink[] {
		const links: ParsedLink[] = [];
		let match;

		// Reset regex lastIndex
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

	// Generate content hash for change detection
	private generateContentHash(content: string): string {
		return crypto.createHash("md5").update(content).digest("hex");
	}

	// Update note metadata
	async updateNoteMeta(notePath: string, content: string): Promise<void> {
		const name = path.basename(notePath, ".md");
		const contentHash = this.generateContentHash(content);

		// Extract title from content (first heading)
		const titleMatch = content.match(/^#\s+(.+)$/m);
		const title = titleMatch ? titleMatch[1].trim() : name;

		const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO note_metadata 
      (path, name, title, last_modified, content_hash)
      VALUES (?, ?, ?, datetime('now'), ?)
    `);

		stmt.run(notePath, name, title, contentHash);
	}

	// Check if content has changed
	async hasContentChanged(notePath: string, content: string): Promise<boolean> {
		const currentHash = this.generateContentHash(content);
		const stmt = this.db.prepare(`
      SELECT content_hash FROM note_metadata WHERE path = ?
    `);

		const result = stmt.get(notePath) as { content_hash: string } | undefined;
		return !result || result.content_hash !== currentHash;
	}

	// Resolve link target path
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

	// Update target paths for all links
	private async updateLinkTargetPaths(): Promise<void> {
		// Get all links that need resolution
		const linksStmt = this.db.prepare(`
      SELECT DISTINCT target_note_name FROM note_links
    `);

		const targetNames = linksStmt.all() as Array<{ target_note_name: string }>;

		for (const { target_note_name } of targetNames) {
			const targetPath = await this.resolveLinkTarget(target_note_name);

			const updateStmt = this.db.prepare(`
        UPDATE note_links 
        SET target_path = ?, updated_at = datetime('now')
        WHERE target_note_name = ?
      `);

			updateStmt.run(targetPath, target_note_name);
		}
	}

	// Update links for a note
	async updateNoteLinks(sourcePath: string, content: string): Promise<void> {
		return this.transaction(async () => {
			// Update note metadata first
			await this.updateNoteMeta(sourcePath, content);

			// Only update links if content has changed
			if (!(await this.hasContentChanged(sourcePath, content))) {
				// Still update target paths in case other notes were renamed
				await this.updateLinkTargetPaths();
				return;
			}

			// Remove existing links for this note
			const deleteStmt = this.db.prepare(`
        DELETE FROM note_links WHERE source_path = ?
      `);
			deleteStmt.run(sourcePath);

			// Parse and insert new links
			const links = this.parseLinks(content);
			if (links.length > 0) {
				const insertStmt = this.db.prepare(`
          INSERT INTO note_links 
          (source_path, target_note_name, target_path, link_text, position_start, position_end)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

				for (const link of links) {
					const targetPath = await this.resolveLinkTarget(link.targetName);
					insertStmt.run(
						sourcePath,
						link.targetName,
						targetPath,
						link.text,
						link.start,
						link.end,
					);
				}
			}

			// Update all target paths to catch any changes
			await this.updateLinkTargetPaths();
		});
	}

	// Get backlinks for a note
	async getBacklinks(notePath: string): Promise<
		Array<{
			sourcePath: string;
			sourceTitle: string;
			linkText: string;
			context?: string;
		}>
	> {
		// Get by both path and name
		const noteName = path.basename(notePath, ".md");

		const stmt = this.db.prepare(`
      SELECT 
        nl.source_path,
        nl.link_text,
        nm.title as source_title
      FROM note_links nl
      LEFT JOIN note_metadata nm ON nl.source_path = nm.path
      WHERE nl.target_path = ? OR nl.target_note_name = ?
      ORDER BY nm.last_modified DESC
    `);

		return stmt.all(notePath, noteName) as Array<{
			sourcePath: string;
			sourceTitle: string;
			linkText: string;
		}>;
	}

	// Get outgoing links for a note
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
        nl.target_path,
        nl.link_text
      FROM note_links nl
      WHERE nl.source_path = ?
      ORDER BY nl.position_start
    `);

		const links = stmt.all(sourcePath) as Array<{
			target_note_name: string;
			target_path?: string;
			link_text: string;
		}>;

		return links.map((link) => ({
			targetName: link.target_note_name,
			targetPath: link.target_path,
			linkText: link.link_text,
			resolved: !!link.target_path,
		}));
	}

	// Get all bidirectional links for graph visualization
	async getAllLinks(): Promise<
		Array<{
			source: string;
			target: string;
			value: number;
		}>
	> {
		const stmt = this.db.prepare(`
      SELECT 
        source_path,
        target_path,
        COUNT(*) as link_count
      FROM note_links 
      WHERE target_path IS NOT NULL
      GROUP BY source_path, target_path
      ORDER BY link_count DESC
    `);

		const results = stmt.all() as Array<{
			source_path: string;
			target_path: string;
			link_count: number;
		}>;

		return results.map((result) => ({
			source: result.source_path,
			target: result.target_path,
			value: result.link_count,
		}));
	}

	// Get all notes for autocomplete
	async getAllNoteNames(): Promise<string[]> {
		const stmt = this.db.prepare(`
      SELECT name FROM note_metadata 
      ORDER BY last_modified DESC
    `);

		return (stmt.all() as Array<{ name: string }>).map((row) => row.name);
	}

	// Get link suggestions based on partial text
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
