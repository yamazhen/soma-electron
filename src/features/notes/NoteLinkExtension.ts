import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { RangeSetBuilder, StateField } from "@codemirror/state";
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

function getAllNoteNames(): string[] {
  return [
    "Meeting Notes",
    "Project Notes",
    "Research Notes",
    "Personal Notes",
    "Study Notes",
  ];
}

const wikiLinkField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(linkDecorations, tr) {
    linkDecorations = linkDecorations.map(tr.changes);
    if (tr.docChanged) {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = tr.state.doc;
      const text = doc.toString();
      const wikiLinkRegex = /::(.*?)::/g;
      let match;
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const linkText = match[1];

        const hideColonsDeco = Decoration.mark({
          class: "cm-markdoc-hidden",
        });
        const linkDeco = Decoration.mark({
          class: "cm-note-link",
          attributes: {
            "data-note-link": linkText,
          },
        });

        builder.add(start, start + 2, hideColonsDeco);
        builder.add(start + 2, end - 2, linkDeco);
        builder.add(end - 2, end, hideColonsDeco);
      }
      return builder.finish();
    }
    return linkDecorations;
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

// Properly type the completion function
function wikiLinkCompletions(
  context: CompletionContext,
): CompletionResult | null {
  // Only activate when we have [[ before the cursor
  const { state, pos } = context;
  const line = state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  // Check if we're in the middle of typing a wiki link
  if (!/::([^:]*)?$/.test(textBefore)) return null;

  // Get the text after the [[ but before the cursor
  const match = textBefore.match(/::([^:]*)?$/);
  if (!match) return null;

  const prefix = match[1];
  const startPos = pos - prefix.length - 2; // -2 for the [[ characters

  // Get all existing notes and filter based on prefix
  const noteNames = getAllNoteNames();
  const filteredNotes = prefix
    ? noteNames.filter((name) =>
        name.toLowerCase().includes(prefix.toLowerCase()),
      )
    : noteNames;

  return {
    from: startPos + 2, // Start after [[
    options: filteredNotes.map((name) => ({
      label: name,
      apply: name + "::",
      type: "note",
    })),
    validFor: /^[^:]*/,
  };
}

// Create the extension
export function wikiLinks() {
  return [
    wikiLinkField,
    autocompletion({
      override: [wikiLinkCompletions],
    }),
    // Handle click events on links
    EditorView.domEventHandlers({
      click: (event: MouseEvent, view: EditorView) => {
        // Properly cast target to HTMLElement with null check
        const target = event.target as HTMLElement | null;
        if (target && target.classList.contains("cm-note-link")) {
          // Get the link text from the data attribute
          const linkText = target.getAttribute("data-note-link");

          if (linkText) {
            // Handle navigation to the linked note
            console.log(`Navigate to: ${linkText}`);

            // Prevent default behavior
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    }),
  ];
}
