import { useEffect } from "react";

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
	useEffect(() => {
		if (!selectedFile || !noteContent || loading) return;

		const saveTimeout = setTimeout(async () => {
			try {
				await window.fileSystem.writeMarkdownFile(selectedFile, noteContent);
			} catch (error) {
				console.log("Error saving note:", error);
			}
		}, 500);

		return () => clearTimeout(saveTimeout);
	}, [noteContent, selectedFile, loading]);
};
