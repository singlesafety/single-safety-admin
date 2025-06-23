import { SGISAuthRequest, SGISAuthResponse, SGISTokenInfo, SGISError } from '@/lib/types/sgis';

class SGISTokenManager {
  private static instance: SGISTokenManager;
  private tokenInfo: SGISTokenInfo | null = null;
  private refreshPromise: Promise<SGISTokenInfo> | null = null;

  private constructor() {}

  static getInstance(): SGISTokenManager {
    if (!SGISTokenManager.instance) {
      SGISTokenManager.instance = new SGISTokenManager();
    }
    return SGISTokenManager.instance;
  }

  private async authenticate(): Promise<SGISTokenInfo> {
    const consumerKey = process.env.SGIS_CONSUMER_KEY;
    const consumerSecret = process.env.SGIS_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error('SGIS credentials not found in environment variables');
    }

    try {
      const url = new URL('https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json');
      url.searchParams.set('consumer_key', consumerKey);
      url.searchParams.set('consumer_secret', consumerSecret);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SGISAuthResponse = await response.json();

      if (!data.result?.accessToken || !data.result?.accessTimeout) {
        throw new Error('Invalid response from SGIS API');
      }

      const expiresAt = new Date(parseInt(data.result.accessTimeout) * 1000);
      
      return {
        accessToken: data.result.accessToken,
        expiresAt,
      };
    } catch (error) {
      console.error('SGIS authentication failed:', error);
      throw error;
    }
  }

  private isTokenExpired(tokenInfo: SGISTokenInfo): boolean {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5분 버퍼
    return tokenInfo.expiresAt.getTime() - now.getTime() < bufferTime;
  }

  async getAccessToken(): Promise<string> {
    // 토큰이 없거나 만료된 경우
    if (!this.tokenInfo || this.isTokenExpired(this.tokenInfo)) {
      // 이미 갱신 중인 요청이 있다면 대기
      if (this.refreshPromise) {
        this.tokenInfo = await this.refreshPromise;
      } else {
        // 새로운 갱신 요청 시작
        this.refreshPromise = this.authenticate();
        try {
          this.tokenInfo = await this.refreshPromise;
        } finally {
          this.refreshPromise = null;
        }
      }
    }

    return this.tokenInfo.accessToken;
  }

  async refreshToken(): Promise<void> {
    this.tokenInfo = null;
    await this.getAccessToken();
  }

  getTokenInfo(): SGISTokenInfo | null {
    return this.tokenInfo;
  }

  clearToken(): void {
    this.tokenInfo = null;
    this.refreshPromise = null;
  }
}

export const sgisTokenManager = SGISTokenManager.getInstance();

export class SGISClient {
  private tokenManager: SGISTokenManager;

  constructor() {
    this.tokenManager = sgisTokenManager;
  }

  async makeAuthenticatedRequest<T>(
    endpoint: string,
    params: Record<string, string> = {},
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.tokenManager.getAccessToken();
    
    const url = new URL(endpoint);
    url.searchParams.set('accessToken', accessToken);
    
    // 추가 파라미터 설정
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // 인증 오류인 경우 토큰 갱신 후 재시도
      if (response.status === 401 || response.status === 403) {
        await this.tokenManager.refreshToken();
        const newAccessToken = await this.tokenManager.getAccessToken();
        
        const retryUrl = new URL(endpoint);
        retryUrl.searchParams.set('accessToken', newAccessToken);
        Object.entries(params).forEach(([key, value]) => {
          retryUrl.searchParams.set(key, value);
        });
        
        const retryResponse = await fetch(retryUrl.toString(), {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`SGIS API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }

        return retryResponse.json();
      }

      throw new Error(`SGIS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const sgisClient = new SGISClient();