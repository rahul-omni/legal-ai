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
