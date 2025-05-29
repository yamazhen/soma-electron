import { ipcMain } from "electron";
import axios, { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { env } from "../config";

const handleApiResponse = async <T>(
	axiosPromise: Promise<
		AxiosResponse<ServerSuccessResponse<T> | ServerErrorResponse>
	>,
): Promise<ServerResponse<T>> => {
	try {
		const response = await axiosPromise;
		return {
			statusCode: response.status,
			body: response.data,
		};
	} catch (error) {
		if (error instanceof AxiosError && error.response) {
			return {
				statusCode: error.response.status,
				body: error.response.data,
			};
		}
		throw new Error(error instanceof Error ? error.message : "Unknown error");
	}
};

export function setupApiHandlers() {
	ipcMain.handle("api:get", async (_event, endpoint) => {
		return handleApiResponse(axios.get(`${env.gatewayUrl}${endpoint}`));
	});

	ipcMain.handle("api:put", async (_event, endpoint, data) => {
		return handleApiResponse(axios.put(`${env.gatewayUrl}${endpoint}`, data));
	});

	ipcMain.handle("api:post", async (_event, endpoint, data) => {
		return handleApiResponse(axios.post(`${env.gatewayUrl}${endpoint}`, data));
	});

	ipcMain.handle("api:delete", async (_event, endpoint) => {
		return handleApiResponse(axios.delete(`${env.gatewayUrl}${endpoint}`));
	});
}
