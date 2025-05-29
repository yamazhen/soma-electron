import { ipcMain } from "electron";
import { LinkService } from "../service/linkService";

export function setupLinkHandlers() {
	const linkService = new LinkService();

	// Update links when note content changes
	ipcMain.handle(
		"links:update-note-links",
		async (_, sourcePath: string, content: string) => {
			try {
				await linkService.updateNoteLinks(sourcePath, content);
				return { success: true };
			} catch (error) {
				console.error("Error updating note links:", error);
				return { success: false, error: error.message };
			}
		},
	);

	// Resolve link target
	ipcMain.handle("links:resolve-target", async (_, targetName: string) => {
		try {
			const targetPath = await linkService.resolveLinkTarget(targetName);
			return { success: true, targetPath };
		} catch (error) {
			console.error("Error resolving link target:", error);
			return { success: false, error: error.message };
		}
	});

	// Get backlinks for a note
	ipcMain.handle("links:get-backlinks", async (_, notePath: string) => {
		try {
			const backlinks = await linkService.getBacklinks(notePath);
			return { success: true, backlinks };
		} catch (error) {
			console.error("Error getting backlinks:", error);
			return { success: false, error: error.message };
		}
	});

	// Get outgoing links for a note
	ipcMain.handle("links:get-outgoing-links", async (_, sourcePath: string) => {
		try {
			const links = await linkService.getOutgoingLinks(sourcePath);
			return { success: true, links };
		} catch (error) {
			console.error("Error getting outgoing links:", error);
			return { success: false, error: error.message };
		}
	});

	// Get link suggestions for autocomplete
	ipcMain.handle(
		"links:get-suggestions",
		async (_, partialText: string, limit: number = 10) => {
			try {
				const suggestions = await linkService.getLinkSuggestions(
					partialText,
					limit,
				);
				return { success: true, suggestions };
			} catch (error) {
				console.error("Error getting link suggestions:", error);
				return { success: false, error: error.message };
			}
		},
	);

	// Get all note names
	ipcMain.handle("links:get-all-names", async () => {
		try {
			const names = await linkService.getAllNoteNames();
			return { success: true, names };
		} catch (error) {
			console.error("Error getting note names:", error);
			return { success: false, error: error.message };
		}
	});
}
