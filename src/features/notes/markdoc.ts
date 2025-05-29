import markdoc from "@markdoc/markdoc";
import type { Config } from "@markdoc/markdoc";

markdoc.transformer.findSchema = (node, config) => {
	return node.tag
		? (config?.tags?.[node.tag] ?? config?.tags?.$$fallback)
		: config?.nodes?.[node.type];
};

export default {
	nodes: {
		softbreak: {
			render: "br",
		},
		hardbreak: {
			render: "br",
		},
		paragraph: {
			render: "p",
		},
		text: {
			render: "span",
		},
		document: {
			render: "div",
		},
	},
	tags: {
		$$fallback: {
			transform(node, config) {
				const children = node.transformChildren(config);
				const className = "cm-markdoc-fallbackTag";
				return new markdoc.Tag("div", { class: className }, [
					new markdoc.Tag("div", { class: `${className}--name` }, [
						node?.tag ?? "",
					]),
					new markdoc.Tag("div", { class: `${className}--inner` }, children),
				]);
			},
		},
		callout: {
			transform(node, config) {
				const children = node.transformChildren(config);
				const kind = node.attributes.type === "warning" ? "warning" : "info";
				const icon = kind === "warning" ? "icon-exclamation" : "icon-info";
				const className = `cm-markdoc-callout cm-markdoc-callout--${kind}`;
				return new markdoc.Tag("div", { class: className }, [
					new markdoc.Tag("span", { class: `icon ${icon}` }),
					new markdoc.Tag("div", {}, children),
				]);
			},
		},
		wikilink: {
			attributes: {
				note: { type: String, required: true },
			},
			transform(node, config) {
				const note = node.attributes.note;
				return new markdoc.Tag(
					"a",
					{
						class: "cm-soma-wikilink",
						"data-note": note,
					},
					[note],
				);
			},
		},
	},
} as Config;

// Keep the processWikiLinks function but make it more robust
export function processWikiLinks(content: string): string {
	// Split content by lines to preserve line breaks
	const lines = content.split("\n");
	const processedLines = lines.map((line) => {
		return line.replace(/@@([^@\n]+)@@/g, (_, noteName) => {
			return `{% wikilink note="${noteName}" %}`;
		});
	});
	return processedLines.join("\n");
}
