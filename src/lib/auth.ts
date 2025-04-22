import { db } from "./db";

export async function verifyAuthToken(token: string) {
  if (!token.startsWith("valid-token-")) {
    throw new Error("Invalid token");
  }

  const userId = token.replace("valid-token-", "");

  const user = await db.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export const userIdFromHeader = (request: Request) => {
  const authToken = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");

  if (!authToken) {
    throw new Error("No auth token provided");
  }

  const userId = authToken.replace("valid-token-", "");

  return userId;
};

export function getAuthCookie() {
  const match = document.cookie.match(/authToken=([^;]+)/);
  return match ? match[1] : null;
}

export function setAuthCookie(token: string) {
  document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24}`;
}

export function clearAuthCookie() {
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
