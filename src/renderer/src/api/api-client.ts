export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly response: Response
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let configuredBaseUrl: string | null = null

export function configureApiClient(baseUrl: string): void {
  configuredBaseUrl = baseUrl
}

export class ApiClient {
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      ...init,
      headers: {
        ...this.getAuthHeaders(),
        ...init.headers
      }
    })

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status, response)
    }

    return (await response.json()) as T
  }

  stream(path: string): EventSource {
    return new EventSource(`${this.getBaseUrl()}${path}`)
  }

  private getBaseUrl(): string {
    if (!configuredBaseUrl) {
      throw new Error('API client is not configured')
    }

    return configuredBaseUrl
  }

  private getAuthHeaders(): HeadersInit {
    return {}
  }
}

export const apiClient = new ApiClient()
