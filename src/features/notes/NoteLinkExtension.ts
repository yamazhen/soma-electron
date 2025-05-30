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

function wikiLinkCompletions(
  context: CompletionContext,
): CompletionResult | null {
  const { state, pos } = context;
  const line = state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  if (!/::([^:]*)?$/.test(textBefore)) return null;

  const match = textBefore.match(/::([^:]*)?$/);
  if (!match) return null;

  const prefix = match[1];
  const startPos = pos - prefix.length - 2;

  const noteNames = getAllNoteNames();
  const filteredNotes = prefix
    ? noteNames.filter((name) =>
        name.toLowerCase().includes(prefix.toLowerCase()),
      )
    : noteNames;

  return {
    from: startPos + 2,
    options: filteredNotes.map((name) => ({
      label: name,
      apply: name + "::",
      type: "note",
    })),
    validFor: /^[^:]*/,
  };
}

export function wikiLinks() {
  return [
    wikiLinkField,
    autocompletion({
      override: [wikiLinkCompletions],
    }),
    EditorView.domEventHandlers({
      click: (event: MouseEvent, _view: EditorView) => {
        const target = event.target as HTMLElement | null;
        if (target && target.classList.contains("cm-note-link")) {
          const linkText = target.getAttribute("data-note-link");

          if (linkText) {
            console.log(`Navigate to: ${linkText}`);

            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    }),
  ];
}
