import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export default HighlightStyle.define([
  {
    tag: t.heading1,
    class: "cm-markdoc-heading1",
  },
  {
    tag: t.heading2,
    class: "cm-markdoc-heading2",
  },
  {
    tag: t.heading3,
    class: "cm-markdoc-heading3",
  },
  {
    tag: t.heading4,
    class: "cm-markdoc-heading4",
  },
  {
    tag: t.heading5,
    class: "cm-markdoc-heading5",
  },
  {
    tag: t.heading6,
    class: "cm-markdoc-heading6",
  },
  {
    tag: t.link,
    class: "cm-markdoc-link",
  },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.monospace, class: "cm-markdoc-monospace" },
  { tag: t.content },
  { tag: t.meta, class: "cm-markdoc-meta" },
]);
