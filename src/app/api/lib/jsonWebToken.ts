import { log } from "console";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateJwdToken = (
  payload: object,
  //TODO - need to fix the expiresIn type
  expiresIn: number = 60 * 60 * 24 * 365
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token", { cause: error });
  }
};
