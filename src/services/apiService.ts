class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  async get(endpoint: string) {
    return this.makeRequest("GET", endpoint);
  }

  async post(endpoint: string, data: any, customHeaders?: any) {
    return this.makeRequest("POST", endpoint, data, customHeaders);
  }

  async put(endpoint: string, data: any) {
    return this.makeRequest("PUT", endpoint, data);
  }

  async delete(endpoint: string) {
    return this.makeRequest("DELETE", endpoint);
  }

  async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: any,
  ) {
    let accessToken = await window.secureStore.get("accessToken");

    let response = await this.rawRequest(
      method,
      endpoint,
      data,
      accessToken || undefined,
      customHeaders,
    );

    if (response.statusCode === 401) {
      accessToken = await this.refreshToken();
      if (accessToken) {
        response = await this.rawRequest(
          method,
          endpoint,
          data,
          accessToken,
          customHeaders,
        );
      }
    }
    return response;
  }

  private async rawRequest(
    method: string,
    endpoint: string,
    data?: any,
    token?: string,
    customHeaders?: any,
  ) {
    const options: any = {
      headers: {
        ...(data instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...customHeaders,
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    switch (method.toLowerCase()) {
      case "get":
        return window.serverApi.get(endpoint, options);
      case "post":
        return window.serverApi.post(endpoint, data, options);
      case "put":
        return window.serverApi.put(endpoint, data, options);
      case "delete":
        return window.serverApi.delete(endpoint, options);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(): Promise<string | null> {
    try {
      const refreshToken = await window.secureStore.get("refreshToken");
      if (!refreshToken) {
        await this.logout();
        return null;
      }

      const response = await window.serverApi.post(
        "/api/system/v1/users/refresh-token",
        {
          refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.body.success) {
        const newAccessToken = response.body.data.accessToken;
        await window.secureStore.set("accessToken", newAccessToken);
        return newAccessToken;
      } else {
        await this.logout();
        return null;
      }
    } catch {
      await this.logout();
      return null;
    }
  }

  private async logout() {
    await window.secureStore.delete("accessToken");
    await window.secureStore.delete("refreshToken");
    await window.userData.logout();
  }
}

export const apiHelperService = new ApiService();
