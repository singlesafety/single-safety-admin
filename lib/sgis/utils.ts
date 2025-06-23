import { sgisTokenManager } from './client';

export async function checkSGISTokenStatus() {
  const tokenInfo = sgisTokenManager.getTokenInfo();
  
  if (!tokenInfo) {
    return {
      status: 'not_authenticated',
      message: 'SGIS token not found',
      expiresAt: null,
    };
  }

  const now = new Date();
  const timeUntilExpiry = tokenInfo.expiresAt.getTime() - now.getTime();
  
  if (timeUntilExpiry <= 0) {
    return {
      status: 'expired',
      message: 'SGIS token has expired',
      expiresAt: tokenInfo.expiresAt,
    };
  }

  const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
  
  if (minutesUntilExpiry < 5) {
    return {
      status: 'expiring_soon',
      message: `SGIS token expires in ${minutesUntilExpiry} minutes`,
      expiresAt: tokenInfo.expiresAt,
    };
  }

  return {
    status: 'valid',
    message: `SGIS token is valid for ${minutesUntilExpiry} minutes`,
    expiresAt: tokenInfo.expiresAt,
  };
}

export async function refreshSGISTokenIfNeeded() {
  const status = await checkSGISTokenStatus();
  
  if (status.status === 'expired' || status.status === 'expiring_soon') {
    await sgisTokenManager.refreshToken();
    return {
      refreshed: true,
      message: 'SGIS token has been refreshed',
    };
  }

  return {
    refreshed: false,
    message: status.message,
  };
}