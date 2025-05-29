import { BaseDAL } from "./BaseDAL";

const updateOrderQuery = `
INSERT INTO file_orders (file_path, parent_path, order_index)
VALUES (?, ?, ?)
ON CONFLICT(file_path) DO UPDATE SET
parent_path = excluded.parent_path,
order_index = excluded.order_index
`;

const saveOrderQuery = `
INSERT INTO file_orders (file_path, parent_path, order_index)
VALUES (?, ?, ?) 
ON CONFLICT(file_path) DO UPDATE SET order_index = ?
`;

export class FileOrderDAL extends BaseDAL {
	getFileOrder(parentPath: string): Record<string, number> {
		try {
			const rows = this.db
				.prepare(
					"SELECT file_path, order_index FROM file_orders WHERE parent_path = ?",
				)
				.all(parentPath);
			const orderMap: Record<string, number> = {};
			for (const row of rows) {
				orderMap[row.file_path] = row.order_index;
			}
			return orderMap;
		} catch (error) {
			console.error("Error getting file order:", error);
			return {};
		}
	}

	updateFileOrders(
		orders: Array<{ path: string; parentPath: string; index: number }>,
	): boolean {
		if (orders.length === 0) return true;
		return this.transaction(() => {
			const stmt = this.db.prepare(updateOrderQuery);
			for (const item of orders) {
				stmt.run(item.path, item.parentPath, item.index);
			}
			return true;
		});
	}

	deleteFileOrdersByPath(filePath: string): boolean {
		return this.transaction(() => {
			const stmt = this.db.prepare(
				"DELETE FROM file_orders WHERE file_path = ?",
			);
			stmt.run(filePath);
			const dirStmt = this.db.prepare(
				"DELETE FROM file_orders WHERE file_path LIKE ? OR parent_path LIKE ?",
			);
			dirStmt.run(`${filePath}/%`, `${filePath}/%`);
			return true;
		});
	}

	saveFileOrder(filePath: string, parentPath: string, index: number): boolean {
		try {
			const stmt = this.db.prepare(saveOrderQuery);
			stmt.run(filePath, parentPath, index, index);
			return true;
		} catch (error) {
			console.error("Error saving file order:", error);
			return false;
		}
	}

	updateFilePathsAfterRename(oldPath: string, newPath: string): boolean {
		return this.transaction(() => {
			const stmt = this.db.prepare(
				"UPDATE file_orders SET file_path = ? WHERE file_path = ?",
			);
			stmt.run(newPath, oldPath);

			const updateChildPaths = this.db.prepare(
				`UPDATE file_orders SET 
					file_path = replace(file_path, ?, ?), 
					parent_path = replace(parent_path, ?, ?) 
				WHERE file_path LIKE ? OR parent_path LIKE ?`,
			);
			updateChildPaths.run(
				oldPath,
				newPath,
				oldPath,
				newPath,
				`${oldPath}/%`,
				`${oldPath}/%`,
			);
			return true;
		});
	}

	updateFilePathsAfterMove(
		oldPath: string,
		newPath: string,
		targetDir: string,
	): boolean {
		return this.transaction(() => {
			const stmt = this.db.prepare(
				"UPDATE file_orders SET file_path = ?, parent_path = ? WHERE file_path = ?",
			);
			stmt.run(newPath, targetDir, oldPath);
			return true;
		});
	}
}
