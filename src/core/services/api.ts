type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestHeaders = Record<string, string>;

class Api {
  private baseUrl: string;
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL;
  }

  private async request<P, R>(
    url: string,
    method: RequestMethod,
    data?: P,
    headers?: RequestHeaders
  ): Promise<R> {
    const body = data ? JSON.stringify(data) : undefined;

    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        error.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json() as Promise<R>;
  }

  get<P, R>(url: string): Promise<R> {
    return this.request<P, R>(url, "GET");
  }

  post<P, R>(url: string, data: P): Promise<R> {
    return this.request<P, R>(url, "POST", data);
  }

  put<P, R>(url: string, data: P): Promise<R> {
    return this.request<P, R>(url, "PUT", data);
  }

  patch<P, R>(url: string, data: P): Promise<R> {
    return this.request<P, R>(url, "PATCH", data);
  }

  delete<P, R>(url: string, data: P): Promise<R> {
    return this.request<P, R>(url, "DELETE", data);
  }
}

export const api = new Api();
