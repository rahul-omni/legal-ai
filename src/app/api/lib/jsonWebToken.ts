import { log } from "console";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

console.log("jwt secret", JWT_SECRET);
console.log("jwt secret", !JWT_SECRET);

export const generateJwdToken = (
  payload: object,
  expiresIn: number = 60 * 60 * 24 // 1 day
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
