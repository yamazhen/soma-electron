import { useEffect, useRef } from "react";

interface Props {
	selectedFile: string | null;
	noteContent: string;
	loading: boolean;
}

export const useNoteAutosave = ({
	selectedFile,
	noteContent,
	loading,
}: Props) => {
	const initialContentRef = useRef<string>("");
	const hasLoadedRef = useRef<boolean>(false);

	// Track initial content load
	useEffect(() => {
		if (selectedFile && noteContent && !loading && !hasLoadedRef.current) {
			initialContentRef.current = noteContent;
			hasLoadedRef.current = true;
		}
	}, [selectedFile, noteContent, loading]);

	// Reset when file changes
	useEffect(() => {
		if (selectedFile) {
			hasLoadedRef.current = false;
			initialContentRef.current = "";
		}
	}, [selectedFile]);

	useEffect(() => {
		if (!selectedFile || !noteContent || loading || !hasLoadedRef.current)
			return;

		const saveTimeout = setTimeout(async () => {
			try {
				// Save the file
				await window.fileSystem.writeMarkdownFile(selectedFile, noteContent);

				// Update link relationships
				await window.ipcRenderer.invoke(
					"links:update-note-links",
					selectedFile,
					noteContent,
				);

				// Log activity only if content has actually changed from initial load
				if (noteContent !== initialContentRef.current) {
					const fileName =
						selectedFile.split("/").pop()?.replace(".md", "") || "Untitled";

					// Use the dashboard API to log the activity
					await window.dashboardApi.logActivity(
						"note-edit",
						fileName,
						selectedFile,
						{
							type: "edit",
							contentLength: noteContent.length,
						},
					);
				}
			} catch (error) {
				console.log("Error saving note:", error);
			}
		}, 500);

		return () => clearTimeout(saveTimeout);
	}, [noteContent, selectedFile, loading, hasLoadedRef.current]);
};
