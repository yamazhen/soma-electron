import { autocompletion } from "@codemirror/autocomplete";
import type {
	CompletionContext,
	CompletionResult,
} from "@codemirror/autocomplete";

const WIKI_LINK_START_REGEX = /@@([^@\n]*)$/;

export function createWikiLinkCompletion(
	getAllNotesOnly: () => MarkdownItem[],
	getLinkSuggestions?: (partial: string) => Promise<
		Array<{
			name: string;
			title: string;
			path: string;
		}>
	>,
) {
	async function wikiLinkCompletionSource(
		context: CompletionContext,
	): Promise<CompletionResult | null> {
		const { state, pos } = context;
		const line = state.doc.lineAt(pos);
		const lineText = line.text.slice(0, pos - line.from);

		const match = lineText.match(WIKI_LINK_START_REGEX);
		if (!match) return null;

		const partialNote = match[1];
		const startOfMatch = pos - partialNote.length - 2;

		// Use enhanced suggestions if available
		if (getLinkSuggestions && partialNote.length > 0) {
			try {
				const suggestions = await getLinkSuggestions(partialNote);
				const options = suggestions.map((suggestion) => ({
					label: suggestion.name,
					detail:
						suggestion.title !== suggestion.name ? suggestion.title : undefined,
					apply: `${suggestion.name}@@`,
					type: "text",
					boost: suggestion.title
						.toLowerCase()
						.startsWith(partialNote.toLowerCase())
						? 1
						: 0,
				}));
				return { from: startOfMatch + 2, to: pos, options };
			} catch (error) {
				console.error("Error getting link suggestions:", error);
				// Fall through to basic completion
			}
		}

		// Fallback to basic completion
		const allNotes = getAllNotesOnly().map((item) => item.name);
		const matchingNotes = partialNote
			? allNotes.filter((note) =>
					note.toLowerCase().includes(partialNote.toLowerCase()),
				)
			: allNotes;

		return {
			from: startOfMatch + 2,
			to: pos,
			options: matchingNotes.map((note) => ({
				label: note,
				apply: `${note}@@`,
				type: "text",
			})),
			filter: false,
		};
	}

	return autocompletion({
		override: [wikiLinkCompletionSource],
		activateOnTyping: true,
		icons: false,
	});
}
