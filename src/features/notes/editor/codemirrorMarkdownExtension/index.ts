import { ViewPlugin } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting } from "@codemirror/language";
import tagParser from "./tagParser";
import RichEditPlugin from "./richEdit";
import renderBlock from "./renderBlock";
import type { Config } from "@markdoc/markdoc";
import editorTheme from "./editorTheme";
import { wikiLinkField } from "./wikiLinkPlugin";

export type MarkdocPluginConfig = {
  lezer?: any;
  markdoc: Config;
};

export default function (config: MarkdocPluginConfig) {
  const mergedConfig = {
    ...(config.lezer ?? []),
    extensions: [tagParser, ...(config.lezer?.extensions ?? [])],
  };

  return [
    wikiLinkField,
    ViewPlugin.fromClass(RichEditPlugin, {
      decorations: (v) => v.decorations,
      provide: (v) => [
        renderBlock(config.markdoc),
        syntaxHighlighting(editorTheme),
        markdown(mergedConfig),
      ],
      eventHandlers: {
        mousedown({ target }, view) {
          if (
            target instanceof Element &&
            target.matches(".cm-markdoc-renderBlock *")
          )
            view.dispatch({ selection: { anchor: view.posAtDOM(target) } });
        },
      },
    }),
  ];
}
