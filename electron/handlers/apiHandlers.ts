import type { AxiosResponse } from "axios";
import axios, { AxiosError } from "axios";
import { ipcMain } from "electron";
import { env } from "../config/config";
import FormData from "form-data";

async function handleApiResponse<T>(
  axiosPromise: Promise<
    AxiosResponse<ServerSuccessResponse<T> | ServerErrorResponse>
  >,
): Promise<ServerResponse<T>> {
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
}

export function setupApiHandlers() {
  ipcMain.handle("api:get", async (_event, endpoint, options = {}) => {
    return handleApiResponse(
      axios.get(`${env.gatewayUrl}${endpoint}`, options),
    );
  });

  ipcMain.handle("api:put", async (_event, endpoint, data, options = {}) => {
    return handleApiResponse(
      axios.put(`${env.gatewayUrl}${endpoint}`, data, options),
    );
  });

  ipcMain.handle("api:post", async (_event, endpoint, data, options = {}) => {
    if (data && data.buffer && data.filename && data.contentType) {
      const buffer = Buffer.from(data.buffer);
      const formData = new FormData();
      formData.append("file", buffer, {
        filename: data.filename,
        contentType: data.contentType,
      });

      for (const key of Object.keys(data)) {
        if (key !== "buffer" && key !== "filename" && key !== "contentType") {
          formData.append(key, data[key]);
        }
      }

      const formDataOptions = {
        ...options,
        headers: {
          ...options.headers,
          ...formData.getHeaders(),
        },
      };

      return handleApiResponse(
        axios.post(`${env.gatewayUrl}${endpoint}`, formData, formDataOptions),
      );
    }

    return handleApiResponse(
      axios.post(`${env.gatewayUrl}${endpoint}`, data, options),
    );
  });

  ipcMain.handle("api:delete", async (_event, endpoint, options = {}) => {
    return handleApiResponse(
      axios.delete(`${env.gatewayUrl}${endpoint}`, options),
    );
  });
}
