import { ErrorAuth } from "@/app/api/lib/errors";
import { NextAuthRequest } from "next-auth";

export const userFromSession = async (request: NextAuthRequest) => {
  if (!request.auth) {
    throw new ErrorAuth("User not authenticated");
  }

  return request.auth.user;
};
