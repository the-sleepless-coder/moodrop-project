import { ENV } from '../config/env';

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// HTTP 메소드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 요청 옵션 타입
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

// API 클라이언트 클래스
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = ENV.API_BASE_URL;
    this.timeout = ENV.API_TIMEOUT;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Device-ID': ENV.DEVICE_ID,
      'User-Agent': 'MoodropApp/1.0.0',
      'Accept': 'application/json, text/plain, */*',
    };
  }

  // 기본 fetch 요청
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const { method = 'GET', headers = {}, body, timeout = this.timeout } = options;

    console.log(`🌐 API Request: ${method} ${url}`);
    console.log(`📝 Request body:`, body);
    console.log(`⏱️ Timeout: ${timeout}ms`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`✅ Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.log(`❌ HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`📦 Response data:`, data);
      
      // 서버 응답을 ApiResponse 형태로 래핑
      return {
        success: true,
        data: data,
        message: 'Success'
      } as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.log(`💥 API Error:`, error);
      
      // 에러도 ApiResponse 형태로 반환
      if (error instanceof Error) {
        const errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;
        console.log(`🚨 Final error: ${errorMessage}`);
        
        return {
          success: false,
          error: error.message,
          message: errorMessage
        } as ApiResponse<T>;
      }
      
      return {
        success: false,
        error: 'Unknown error occurred',
        message: 'Unknown error occurred'
      } as ApiResponse<T>;
    }
  }

  // GET 요청
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  // POST 요청
  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  // PUT 요청
  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  // DELETE 요청
  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  // PATCH 요청
  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }
}

// API 클라이언트 인스턴스 생성 및 내보내기
export const apiClient = new ApiClient();
export default apiClient;