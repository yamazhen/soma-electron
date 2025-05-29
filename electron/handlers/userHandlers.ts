import axios from "axios";
import { ipcMain } from "electron";
import { getDatabase } from "../database/database";
import { env } from "../config/config";
import { SecureStoreService } from "../service";

const storeUserQuery = `
INSERT OR REPLACE INTO users
(id,  username, email, display_name, last_opened, last_sync_timestamp)
VALUES (?, ?, ?, ?, ?, ?)
`;

export function setupUserHandlers() {
	const secureStoreService = new SecureStoreService();

	ipcMain.handle("user:store", async (_, user: UserStore) => {
		try {
			const db = getDatabase();
			const stmt = db.prepare(storeUserQuery);

			stmt.run(
				1,
				user.username,
				user.email,
				user.display_name,
				new Date().toISOString(),
				new Date().toISOString(),
			);
		} catch (error) {
			throw error;
		}
	});
	ipcMain.handle("user:load-offline", async (_) => {
		try {
			const db = getDatabase();
			const stmt = db.prepare("SELECT * FROM users WHERE id = 1");
			const user = stmt.get();

			return user || null;
		} catch (error) {
			throw error;
		}
	});
	ipcMain.handle("user:logout", async (_) => {
		try {
			const db = getDatabase();
			const stmt = db.prepare("DELETE FROM users WHERE id = 1");
			stmt.run();
			await secureStoreService.delete("accessToken");
			await secureStoreService.delete("refreshToken");
		} catch (error) {
			throw error;
		}
	});
	ipcMain.handle("user:load-online", async (_) => {
		try {
			const accessToken = await secureStoreService.get("accessToken");
			const response = await axios.get(
				`${env.gatewayUrl}/api/system/v1/users/me`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			const serverResponse: ServerResponse<UserStore> = {
				statusCode: response.status,
				body: response.data,
			};

			if (serverResponse.body.success && serverResponse.body.data) {
				const user = serverResponse.body.data;
				const timestampSync = new Date().toISOString();
				const db = getDatabase();
				const stmt = db.prepare(storeUserQuery);
				stmt.run(
					1,
					user.username,
					user.email,
					user.display_name,
					new Date().toISOString(),
					timestampSync,
				);
				return user;
			}
			return null;
		} catch (error) {
			throw error;
		}
	});
}
