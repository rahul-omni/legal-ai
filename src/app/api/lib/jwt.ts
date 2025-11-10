import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY: StringValue | number = (process.env.ACCESS_TOKEN_EXPIRY || '15m') as StringValue; 
const REFRESH_TOKEN_EXPIRY: StringValue | number = (process.env.REFRESH_TOKEN_EXPIRY || '7d') as StringValue; 

export interface TokenPayload {
  userId: string;
  email: string | null;
  mobileNumber: string;
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { 
      userId: payload.userId,
      email: payload.email,
      mobileNumber: payload.mobileNumber 
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  // Generate JWT refresh token (stateless)
  return jwt.sign(
    { 
      userId: userId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Ensure we have the required fields
    if (!decoded.userId || !decoded.mobileNumber) {
      console.error('Invalid JWT payload:', decoded);
      throw new Error('Invalid token payload');
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email || null,
      mobileNumber: decoded.mobileNumber,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    // Verify JWT token (stateless - no DB check)
    const decoded = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
    
    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      userId: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid or expired refresh token');
    }
    throw error;
  }
}

// No longer needed, but keeping for compatibility
export async function revokeRefreshToken(token: string): Promise<void> {
  // Stateless tokens can't be revoked without a blacklist
  // This is a no-op in stateless implementation
}
