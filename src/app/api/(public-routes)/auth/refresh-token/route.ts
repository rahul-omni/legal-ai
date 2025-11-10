import { NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/app/api/lib/jwt';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required' },
        { status: 400 }
      );
    }
    
    console.log('[Refresh Token] Request received');
    
    // Verify and get user from refresh token
    const tokenPayload = await verifyRefreshToken(refreshToken);
    console.log('[Refresh Token] Verified, userId:', tokenPayload.userId);
    
    // Generate new tokens (stateless - generates new refresh token each time)
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload.userId);
    
    console.log('[Refresh Token] New tokens generated successfully');
    
    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes
    });
    
  } catch (error: any) {
    console.error('[Refresh Token] Error:', error);
    console.error('[Refresh Token] Error details:', {
      message: error.message,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Token refresh failed' 
      },
      { status: 401 }
    );
  }
}

