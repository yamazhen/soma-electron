import { ChevronRight, ChevronDown } from "lucide-react";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { EditorView, gutter, GutterMarker, Decoration } from "@codemirror/view";
import {
  StateField,
  StateEffect,
  Range,
  RangeSet,
  RangeValue,
  Transaction,
  MapMode,
  EditorState,
} from "@codemirror/state";

const toggleFoldEffect = StateEffect.define<number>();

// fold marker component for gutter
class HeadingFoldMarker extends GutterMarker {
  constructor(
    private folded: boolean,
    private level: number,
  ) {
    super();
  }

  eq(other: HeadingFoldMarker): boolean {
    return this.folded === other.folded && this.level === other.level;
  }

  toDOM() {
    const div = document.createElement("div");
    div.className = "cm-heading-fold-marker";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.width = "100%";
    div.style.height = "100%";

    const root = createRoot(div);
    if (this.folded) {
      root.render(createElement(ChevronRight, { size: 16, color: "#9085b3" }));
    } else {
      root.render(createElement(ChevronDown, { size: 16, color: "#9085b3" }));
    }
    return div;
  }
}

// decoration class for folded regions
class FoldDecoration implements RangeValue {
  constructor(
    readonly from: number,
    readonly to: number,
  ) {}

  eq(other: RangeValue): boolean {
    return (
      other instanceof FoldDecoration &&
      this.from === other.from &&
      this.to === other.to
    );
  }

  startSide = 0;
  endSide = 0;
  mapMode = MapMode.TrackDel;
  point = false;

  range(from: number, to: number = from): any {
    return { from, to, value: this };
  }

  map(mapping: any, _from: number, _to: number) {
    let newFrom = mapping.mapPos(this.from);
    let newTo = mapping.mapPos(this.to);
    return newFrom < newTo ? new FoldDecoration(newFrom, newTo) : null;
  }
}

// state field for tracking folded sections
const foldStateField = StateField.define<RangeSet<FoldDecoration>>({
  create() {
    return RangeSet.empty;
  },

  update(folds: RangeSet<FoldDecoration>, tr: Transaction) {
    folds = folds.map(tr.changes);

    for (const effect of tr.effects) {
      if (effect.is(toggleFoldEffect)) {
        const lineNumber = effect.value;
        const line = tr.state.doc.line(lineNumber);

        // check if it's a heading
        const headingMatch = line.text.match(/^(#+)\s+/);
        if (!headingMatch) continue;

        const headingLevel = headingMatch[1].length;
        let endPos = tr.state.doc.length;
        let pos = line.to + 1;
        let foundContent = false;

        // find where section ends (next heading of same or higher level)
        while (pos < tr.state.doc.length) {
          const nextLine = tr.state.doc.lineAt(pos);
          const nextHeadingMatch = nextLine.text.match(/^(#+)\s+/);

          if (nextHeadingMatch) {
            const nextLevel = nextHeadingMatch[1].length;
            if (nextLevel <= headingLevel) {
              // stop before the next heading
              endPos = nextLine.from - 1;
              break;
            }
          }

          // track if we found actual content to fold
          if (nextLine.text.trim() !== "") {
            foundContent = true;
          }

          pos = nextLine.to + 1;
        }

        // check if already folded
        let isFolded = false;
        folds.between(line.from, line.from + 1, () => {
          isFolded = true;
        });

        if (isFolded) {
          // unfold
          folds = folds.update({
            filter: (from) => from !== line.from,
          });
        } else {
          // only fold if we found content
          if (foundContent && endPos > line.to) {
            const decoration = new FoldDecoration(line.to, endPos);
            folds = folds.update({
              add: [{ from: line.from, to: line.from, value: decoration }],
            });
          }
        }
      }
    }

    return folds;
  },

  provide(field) {
    return [
      EditorView.decorations.from(field, (folds: RangeSet<FoldDecoration>) => {
        const decorations: Range<Decoration>[] = [];

        folds.between(0, Infinity, (_from, _to, value) => {
          decorations.push(
            Decoration.replace({
              inclusive: true,
              block: true,
            }).range(value.from, value.to),
          );
        });

        return Decoration.set(decorations);
      }),
    ];
  },
});

// gutter extension that shows fold markers for all headings
const headingFoldGutter = gutter({
  class: "cm-heading-fold-gutter",
  lineMarker: (view: EditorView, line: { from: number; to: number }) => {
    const doc = view.state.doc;
    const lineText = doc.lineAt(line.from).text;
    const headingMatch = lineText.match(/^(#+)\s+/);

    // only show markers for heading lines
    if (!headingMatch) return null;

    const level = headingMatch[1].length;
    const lineNo = doc.lineAt(line.from).number;

    // show fold icon for all headings except the last line
    if (lineNo < doc.lines) {
      // check if folded
      const folds = view.state.field(foldStateField);
      let isFolded = false;

      folds.between(line.from, line.from + 1, () => {
        isFolded = true;
      });

      return new HeadingFoldMarker(isFolded, level);
    }

    return null;
  },

  domEventHandlers: {
    click: (view: EditorView, line: { from: number; to: number }) => {
      const lineText = view.state.doc.lineAt(line.from).text;
      if (!/^#{1,6}\s+.+$/.test(lineText)) return false;

      const lineNumber = view.state.doc.lineAt(line.from).number;
      view.dispatch({
        effects: toggleFoldEffect.of(lineNumber),
      });

      return true;
    },
  },
});

// command to toggle the current heading fold
function toggleHeadingFold(view: EditorView) {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);

  if (!/^#{1,6}\s+.+$/.test(line.text)) return false;

  view.dispatch({
    effects: toggleFoldEffect.of(line.number),
  });

  return true;
}

export const customFoldingExtension = [
  foldStateField,
  headingFoldGutter,
  EditorState.transactionFilter.of((tr: Transaction) => {
    if (!tr.changes.empty) {
      // Check if the transaction contains a newline character
      let hasNewline = false;
      let changePos = -1;

      tr.changes.iterChanges((_, __, fromB, ___, inserted) => {
        // Check if the inserted content contains a newline
        if (inserted.toString().includes("\n")) {
          hasNewline = true;
          changePos = fromB;
        }
      });

      if (hasNewline && changePos >= 0) {
        // Get the line where the newline was inserted
        const line = tr.startState.doc.lineAt(changePos);
        const headingMatch = line.text.match(/^(#+)\s+/);

        if (headingMatch) {
          // Check if this heading is folded
          const folds = tr.startState.field(foldStateField);
          let isFolded = false;

          folds.between(line.from, line.from + 1, () => {
            isFolded = true;
          });

          // If folded, add an effect to unfold it
          if (isFolded) {
            return [tr, { effects: toggleFoldEffect.of(line.number) }];
          }
        }
      }
    }
    return tr;
  }),
];

export { toggleHeadingFold };
