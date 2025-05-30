import { ChevronRight, ChevronDown } from "lucide-react";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { EditorView, gutter, GutterMarker, Decoration } from "@codemirror/view";
import type { Range, RangeValue, Transaction } from "@codemirror/state";
import {
  StateEffect,
  EditorState,
  MapMode,
  StateField,
  RangeSet,
} from "@codemirror/state";

const toggleFoldEffect = StateEffect.define<number>();

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
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.cursor = "pointer";

    const root = createRoot(div);
    if (this.folded) {
      root.render(createElement(ChevronRight, { size: 16, color: "#9085b3" }));
    } else {
      root.render(createElement(ChevronDown, { size: 16, color: "#9085b3" }));
    }
    return div;
  }
}

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
    const newFrom = mapping.mapPos(this.from);
    const newTo = mapping.mapPos(this.to);
    return newFrom < newTo ? new FoldDecoration(newFrom, newTo) : null;
  }
}

const foldStateField = StateField.define<RangeSet<FoldDecoration>>({
  create() {
    return RangeSet.empty;
  },

  update(folds: RangeSet<FoldDecoration>, tr: Transaction) {
    let updatedFolds = folds.map(tr.changes);

    for (const effect of tr.effects) {
      if (effect.is(toggleFoldEffect)) {
        const lineNumber = effect.value;
        const line = tr.state.doc.line(lineNumber);
        const headingMatch = line.text.match(/^(#+)\s+/);
        if (!headingMatch) continue;

        const headingLevel = headingMatch[1].length;
        let endPos = tr.state.doc.length;
        let pos = line.to + 1;
        let foundContent = false;

        while (pos < tr.state.doc.length) {
          const nextLine = tr.state.doc.lineAt(pos);
          const nextHeadingMatch = nextLine.text.match(/^(#+)\s+/);

          if (nextHeadingMatch) {
            const nextLevel = nextHeadingMatch[1].length;
            if (nextLevel <= headingLevel) {
              endPos = nextLine.from - 1;
              break;
            }
          }

          if (nextLine.text.trim() !== "") {
            foundContent = true;
          }

          pos = nextLine.to + 1;
        }

        let isFolded = false;
        updatedFolds.between(line.from, line.from + 1, () => {
          isFolded = true;
        });

        if (isFolded) {
          updatedFolds = updatedFolds.update({
            filter: (from) => from !== line.from,
          });
        } else {
          if (foundContent && endPos > line.to) {
            const decoration = new FoldDecoration(line.to, endPos);
            updatedFolds = updatedFolds.update({
              add: [{ from: line.from, to: line.from, value: decoration }],
            });
          }
        }
      }
    }

    return updatedFolds;
  },

  provide(field) {
    return [
      EditorView.decorations.from(field, (folds: RangeSet<FoldDecoration>) => {
        const decorations: Range<Decoration>[] = [];

        folds.between(0, Number.POSITIVE_INFINITY, (_from, _to, value) => {
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

const headingFoldGutter = gutter({
  lineMarker: (view: EditorView, line: { from: number; to: number }) => {
    const doc = view.state.doc;
    const lineText = doc.lineAt(line.from).text;
    const headingMatch = lineText.match(/^(#+)\s+/);

    if (!headingMatch) return null;

    const level = headingMatch[1].length;
    const lineNo = doc.lineAt(line.from).number;

    if (lineNo < doc.lines) {
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
      let hasNewline = false;
      let changePos = -1;

      tr.changes.iterChanges((_, __, fromB, ___, inserted) => {
        if (inserted.toString().includes("\n")) {
          hasNewline = true;
          changePos = fromB;
        }
      });

      if (hasNewline && changePos >= 0) {
        const line = tr.startState.doc.lineAt(changePos);
        const headingMatch = line.text.match(/^(#+)\s+/);

        if (headingMatch) {
          const folds = tr.startState.field(foldStateField);
          let isFolded = false;

          folds.between(line.from, line.from + 1, () => {
            isFolded = true;
          });

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
