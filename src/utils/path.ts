export function getParentPath(filePath: string) {
	const lastSlashIndex = filePath.lastIndexOf("/");
	if (lastSlashIndex <= 0) return filePath;
	return filePath.substring(0, lastSlashIndex);
}

export function getBaseName(filePath: string) {
	const parts = filePath.replace(/\\/g, "/").split("/");
	return parts.pop() || "";
}

export function joinPaths(parentPath: string, childPath: string): string {
	if (parentPath.endsWith("/") || parentPath.endsWith("\\")) {
		return parentPath + childPath;
	} else {
		return parentPath + "/" + childPath;
	}
}

export const getParentDirName = (filePath: string): string => {
	const withoutFile = filePath.slice(0, filePath.lastIndexOf("/"));
	return withoutFile.slice(withoutFile.lastIndexOf("/") + 1);
};
