type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestHeaders = Record<string, string>;

class Api {
  private baseUrl: string;
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL;
  }

  private async request<Payload, Response>(
    url: string,
    method: RequestMethod,
    data?: Payload,
    headers?: RequestHeaders
  ): Promise<Response> {
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
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<Response>;
  }

  get(url: string) {
    return this.request(url, "GET");
  }

  post<Payload>(url: string, data: Payload) {
    return this.request(url, "POST", data);
  }

  put<Payload>(url: string, data: Payload) {
    return this.request(url, "PUT", data);
  }

  patch<Payload>(url: string, data: Payload) {
    return this.request(url, "PATCH", data);
  }

  delete<Payload>(url: string, data: Payload) {
    return this.request(url, "DELETE", data);
  }
}

export const api = new Api();
