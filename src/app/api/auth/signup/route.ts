import { NextRequest, NextResponse } from "next/server";
import {
  IndividualSignupSchema,
  OrganizationSignupSchema,
} from "../../lib/validation/auth";
import { ErrorResponse, SignupRequest, SignupResponse } from "../types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<SignupResponse | ErrorResponse>> {
  console.log("Received signup request:", req.body); // Debugging line

  try {
    const { signupType, ...data } = (await req.json()) as SignupRequest;
    console.log("Parsed request data:", { signupType, data }); // Log parsed data

    if (!signupType) {
      console.warn("Signup type is missing in the request"); // Warning log
      return NextResponse.json(
        { message: "Signup type is required" },
        { status: 400 }
      );
    }

    console.log("Validating input for signup type:", signupType); // Log signup type

    // Validate input based on signup type
    if (signupType === "individual") {
      const validation = IndividualSignupSchema.safeParse(data); // Use 'data' instead of 'req.body'
      console.log("Validation result for individual:", validation); // Log validation result
      if (!validation.success) {
        console.warn("Validation failed for individual signup"); // Warning log
        return NextResponse.json(
          { message: "invalid request" },
          { status: 400 }
        );
      }
    } else if (signupType === "organization") {
      const validation = OrganizationSignupSchema.safeParse(data); // Use 'data' instead of 'req.body'
      console.log("Validation result for organization:", validation); // Log validation result
      if (!validation.success) {
        console.warn("Validation failed for orgsanization signup"); // Warning log
        return NextResponse.json(
          { message: "invalid request" },
          { status: 400 }
        );
      }
    } else {
      console.error("Invalid signup type provided:", signupType); // Error log
      return NextResponse.json(
        { message: "Invalid signup type" },
        { status: 400 }
      );
    }

    console.log("Attempting dynamic import for signup handler:", signupType); // Log dynamic import
    const { default: signupHandler } = await import(`./${signupType}`);
    console.log("Signup handler imported successfully"); // Log successful import
    return signupHandler(data);
  } catch (error) {
    console.error("Signup routing error:", error); // Error log
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
