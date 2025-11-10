// Mobile App Token Management Example

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Helper to refresh token when expired
export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Helper to make authenticated API calls with auto-refresh
export async function authenticatedFetch(url: string, options: RequestInit, accessToken: string, storedRefreshToken: string): Promise<Response> {
  // Make request with access token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If token expired (401), refresh and retry
  if (response.status === 401) {
    console.log('Access token expired, refreshing...');
    
    try {
      const newTokens = await refreshToken(storedRefreshToken);
      
      // Retry request with new access token
      return await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newTokens.accessToken}`
        }
      });
    } catch (refreshError) {
      // Refresh failed, user needs to login again
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

