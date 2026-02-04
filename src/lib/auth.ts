import { ErrorAuth } from "@/app/api/lib/errors";
import { NextAuthRequest } from "next-auth";
import { verifyAccessToken } from "@/app/api/lib/jwt";

export const userFromSession = async (request: NextAuthRequest) => {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    // Mobile authentication
    try {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      
      // console.log('JWT decoded:', { userId: decoded.userId, email: decoded.email });
      
      // Return user in NextAuth format
      return {
        id: decoded.userId,
        email: decoded.email,
        mobileNumber: decoded.mobileNumber,
      };
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new ErrorAuth(`Invalid or expired token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Web authentication with NextAuth cookie
  if (!request.auth) {
    throw new ErrorAuth("User not authenticated");
  }

  return request.auth.user;
};
