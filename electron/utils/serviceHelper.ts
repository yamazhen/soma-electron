export async function handleServiceCall<T>(
  operation: () => Promise<T> | T,
  errorMessage?: string,
): Promise<IpcResponseData<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error(errorMessage || "Service operation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function handleServiceOperation(
  operation: () => Promise<void | boolean> | void | boolean,
  errorMessage?: string,
): Promise<IpcResponse> {
  try {
    const result = await operation();
    return { success: result !== false };
  } catch (error) {
    console.error(errorMessage || "Service operation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
