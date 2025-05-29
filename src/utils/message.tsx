import type React from "react";

export const formatMessageWithTags = (message: string): React.ReactNode[] => {
	const regex = /<strongStart>(.*?)<\/strongEnd>/g;
	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let uniqueId = 0;

	match = regex.exec(message);

	while (match !== null) {
		if (match.index > lastIndex) {
			parts.push(
				<span key={`text-${uniqueId++}`}>
					{message.substring(lastIndex, match.index)}
				</span>,
			);
		}

		parts.push(<strong key={`strong-${uniqueId++}`}>{match[1]}</strong>);

		lastIndex = regex.lastIndex;
		match = regex.exec(message);
	}

	if (lastIndex < message.length) {
		parts.push(
			<span key={`text-${uniqueId++}`}>{message.substring(lastIndex)}</span>,
		);
	}

	return parts;
};
