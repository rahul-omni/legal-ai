import { NextRequest, NextResponse } from "next/server";
import {
  IndividualSignupSchema,
  OrganizationSignupSchema,
} from "../../lib/validation/auth";
import { ErrorResponse, SignupRequest, SignupResponse } from "../types";

const validationSchemas = {
  individual: IndividualSignupSchema,
  organization: OrganizationSignupSchema,
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<SignupResponse | ErrorResponse>> {
  try {
    const { signupType, ...data } = (await req.json()) as SignupRequest;

    if (!signupType || !(signupType in validationSchemas)) {
      return NextResponse.json(
        { errMsg: "Invalid or missing signup type" },
        { status: 400 }
      );
    }

    const validation = validationSchemas[signupType].safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { errMsg: "Invalid request data" },
        { status: 400 }
      );
    }

    try {
      const { default: signupHandler } = await import(`./${signupType}`);
      return signupHandler(validation.data);
    } catch (importError) {
      return NextResponse.json(
        { errMsg: "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { errMsg: "Internal server error" },
      { status: 500 }
    );
  }
}
