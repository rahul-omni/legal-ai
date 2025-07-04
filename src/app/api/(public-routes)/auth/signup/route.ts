import {
  ErrorApp,
  ErrorResponse,
  handleError,
  ErrorValidation,
} from "@/app/api/lib/errors";
import { NextRequest, NextResponse } from "next/server";
import {
  individualSignupSchema,
  organizationSignupSchema,
} from "../../../lib/validation/authValidation";
import { SignupRequest, SignupResponse } from "../types";

const validationSchemas = {
  individual: individualSignupSchema,
  organization: organizationSignupSchema,
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<SignupResponse | ErrorResponse>> {
  try {
    const { signupType, ...data } = (await req.json()) as SignupRequest;
    console.log("Signup request received", { signupType, data });
    
    if (!signupType || !(signupType in validationSchemas)) {
      throw new ErrorValidation("Invalid or missing signup type");
    }

    const validation = validationSchemas[signupType].safeParse(data);
    if (!validation.success) {
      throw new ErrorValidation("Invalid request data");
    }

    try {
      const { default: signupHandler } = await import(`./${signupType}`);
      return signupHandler(validation.data);
    } catch (importError) {
      throw new ErrorApp("Failed to import signup handler");
    }
  } catch (error) {
    return handleError(error);
  }
}
