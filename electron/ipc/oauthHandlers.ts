import axios from "axios";
import { ipcMain, shell } from "electron";
import { windowManager } from "../windows/windowManager";

export function setupOAuthHandlers() {
	ipcMain.handle(
		"oauth:google-init",
		async (
			_,
			options: { apiUrl: string; clientType?: string; redirectUri?: string },
		) => {
			try {
				const mainWindow = windowManager.getWindow("main");
				if (!mainWindow) throw new Error("Main window not found");

				const { apiUrl, clientType = "desktop" } = options;

				const params: Record<string, string> = { client: clientType };
				if (options.redirectUri) {
					params.redirect_uri = options.redirectUri;
				}
				const response = await axios.get(
					`${apiUrl}/api/system/v1/users/auth/google/init`,
					{
						params: { client: clientType },
						validateStatus: (status) => status < 500,
					},
				);

				if (response.status !== 200 || !response.data.success) {
					throw new Error(
						`Server returned error: ${response.data.message || response.statusText}`,
					);
				}

				const authUrl = response.data.data?.authUrl;
				if (!authUrl) {
					throw new Error("No auth URL returned from server");
				}

				await shell.openExternal(authUrl);
				return { success: true, authUrl: authUrl };
			} catch (error) {
				console.error("Error initializing Google OAuth:", error);
				return { success: false, error: "Failed to initialize Google OAuth" };
			}
		},
	);
}
