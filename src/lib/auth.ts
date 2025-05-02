import { verifyToken as verifyJwdToken } from "@/app/api/lib/jsonWebToken";

export const userIdFromHeader = (request: Request) => {
  const authToken = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");

  if (!authToken) {
    throw new Error("No auth token provided");
  }

  const { user } = verifyJwdToken(authToken);
  console.log(user, "user from token");

  return user.id;
};

export function getAuthCookie() {
  const match = document.cookie.match(/authToken=([^;]+)/);
  return match ? match[1] : null;
}

export function setAuthCookie(token: string, isVerified?: boolean) {
  document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24}`;
}

export function clearAuthCookie() {
  document.cookie = "verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
