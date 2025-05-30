import markdoc, { nodes } from "@markdoc/markdoc";
import type { Config } from "@markdoc/markdoc";

markdoc.transformer.findSchema = (node, config) => {
	return node.tag
		? (config?.tags?.[node.tag] ?? config?.tags?.$$fallback)
		: config?.nodes?.[node.type];
};

export default {
	nodes: {
		...nodes,
		softbreak: {
			render: "br",
		},
		hardbreak: {
			render: "br",
		},
		heading: {
			...nodes.heading,
			transform(node, config) {
				const level = node.attributes.level || 1;
				const tagName = `h${Math.min(Math.max(level, 1), 6)}`;
				const children = node.transformChildren(config);
				return new markdoc.Tag(tagName, node.attributes, children);
			},
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
				standalone: { type: Boolean, default: false },
			},
			transform(node, _config) {
				const note = node.attributes.note;
				const isStandalone = node.attributes.standalone;

				if (isStandalone) {
					return new markdoc.Tag(
						"div",
						{
							class: "cm-soma-wikilink-block",
							style: "margin: 0.2em 0;",
						},
						[
							new markdoc.Tag(
								"a",
								{
									class: "cm-soma-wikilink",
									"data-note": note,
									href: "#",
								},
								[note],
							),
						],
					);
				}
				return new markdoc.Tag(
					"a",
					{
						class: "cm-soma-wikilink",
						"data-note": note,
						href: "#",
					},
					[note],
				);
			},
		},
	},
} as Config;

export function processWikiLinks(content: string): string {
	const lines = content.split("\n");
	const processedLines = lines.map((line) => {
		const trimmedLine = line.trim();

		// Check if this line contains only a wikilink
		const standaloneWikiLinkMatch = trimmedLine.match(/^@@([^@\n]+)@@$/);
		if (standaloneWikiLinkMatch) {
			const cleanNoteName = standaloneWikiLinkMatch[1].trim();
			// Mark as standalone to render as block element
			return `{% wikilink note="${cleanNoteName}" standalone=true /%}`;
		}

		// For lines with inline wikilinks, process normally
		return line.replace(/@@([^@\n]+)@@/g, (_, noteName) => {
			const cleanNoteName = noteName.trim();
			return `{% wikilink note="${cleanNoteName}" /%}`;
		});
	});

	return processedLines.join("\n");
}
