export interface SGISAuthRequest {
  consumer_key: string;
  consumer_secret: string;
}

export interface SGISAuthResponse {
  result: {
    accessToken: string;
    accessTimeout: string;
  };
}

export interface SGISTokenInfo {
  accessToken: string;
  expiresAt: Date;
}

export interface SGISError {
  errMsg: string;
  errCd: string;
}