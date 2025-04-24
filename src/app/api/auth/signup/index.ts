import { NextApiRequest, NextApiResponse } from "next";
import {
  IndividualSignupSchema,
  OrganizationSignupSchema,
} from "../../lib/validation/auth";
import { ErrorResponse, SignupRequest, SignupResponse } from "../types";

export default async function POST(
  req: NextApiRequest & { body: SignupRequest },
  res: NextApiResponse<SignupResponse | ErrorResponse>
) {
  try {
    const { signupType } = req.body;

    if (!signupType) {
      return res.status(400).json({ message: "Signup type is required" });
    }

    // Validate input based on signup type
    if (signupType === "individual") {
      const validation = IndividualSignupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
    } else if (signupType === "organization") {
      const validation = OrganizationSignupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
    } else {
      return res.status(400).json({ message: "Invalid signup type" });
    }

    // Dynamic import based on signup type
    const { default: signupHandler } = await import(`./${signupType}`);
    return signupHandler(req, res);
  } catch (error) {
    console.error("Signup routing error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
