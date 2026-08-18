import { Ability } from 'hand-baked-screenplay-pattern';

export interface ApiResponse<T = any> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

export class CallAnApi extends Ability {
  private lastResponse: ApiResponse | null = null;

  static at(baseUrl: string): CallAnApi {
    return new CallAnApi(baseUrl);
  }

  constructor(public readonly baseUrl: string) {
    super();
  }

  getLastResponse<T = any>(): ApiResponse<T> {
    if (!this.lastResponse) {
      throw new Error(`[CallAnApi] No response recorded for ${this.baseUrl}`);
    }
    return this.lastResponse as ApiResponse<T>;
  }

  async sendRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options: RequestInit = {
      method,
      headers: requestHeaders
    };

    if (body !== undefined && method !== 'GET') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const res = await fetch(url, options);

    let parsedBody: any = null;
    const text = await res.text();
    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    this.lastResponse = {
      status: res.status,
      body: parsedBody,
      headers: responseHeaders
    };

    return this.lastResponse;
  }
}
