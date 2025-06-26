import { StateField, EditorState } from "@codemirror/state";
import { EditorView, Decoration, DecorationSet } from "@codemirror/view";

const WIKI_LINK_REGEX = /@@([^@\n]+)@@/g;

const hideAtSymbolsDecoration = Decoration.mark({ class: "cm-markdoc-hidden" });
const wikiLinkDecoration = Decoration.mark({ class: "cm-soma-wikilink" });

function findWikiLinks(state: EditorState): DecorationSet {
  const decorations = [];
  const cursor = state.selection.main;

  const text = state.doc.toString();
  let match;

  WIKI_LINK_REGEX.lastIndex = 0;

  while ((match = WIKI_LINK_REGEX.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (cursor.from < start || cursor.to > end) {
      decorations.push(hideAtSymbolsDecoration.range(start, start + 2));

      decorations.push(hideAtSymbolsDecoration.range(end - 2, end));

      decorations.push(wikiLinkDecoration.range(start + 2, end - 2));
    }
  }

  decorations.sort((a, b) => {
    if (a.from != b.from) return a.from - b.from;
    return (a.value.startSide || 0) - (b.value.startSide || 0);
  });

  return Decoration.set(decorations);
}

export const wikiLinkField = StateField.define<DecorationSet>({
  create(state: EditorState) {
    return findWikiLinks(state);
  },

  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);

    if (transaction.docChanged || transaction.selection) {
      return findWikiLinks(transaction.state);
    }

    return decorations;
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});
