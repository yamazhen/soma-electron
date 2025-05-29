import { ipcRenderer } from "electron";

export const oAuthApi = {
	initGoogleLogin: (options) =>
		ipcRenderer.invoke("oauth:google-init", options),

	onAuthSuccess: (callback) => {
		const subscription = (_, data) => {
			callback(data);
		};
		ipcRenderer.on("auth-callback-success", subscription);
		return () => {
			ipcRenderer.removeListener("auth-callback-success", subscription);
		};
	},

	onAuthError: (callback) => {
		const subscription = (_, error) => {
			callback(error);
		};
		ipcRenderer.on("auth-callback-error", subscription);
		return () => {
			ipcRenderer.removeListener("auth-callback-error", subscription);
		};
	},
};
