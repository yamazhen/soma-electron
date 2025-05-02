import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

const WIKI_LINK_START_REGEX = /@@([^@\n]*)$/;

export function createWikiLinkCompletion(
  getAllNotesOnly: () => MarkdownItem[],
) {
  function wikiLinkCompletionSource(
    context: CompletionContext,
  ): CompletionResult | null {
    const { state, pos } = context;
    const line = state.doc.lineAt(pos);
    const lineText = line.text.slice(0, pos - line.from);

    const match = lineText.match(WIKI_LINK_START_REGEX);
    if (!match) return null;

    const partialNote = match[1];
    const startOfMatch = pos - partialNote.length - 2;

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
        apply: note + "@@",
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
