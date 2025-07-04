// import {
//   ErrorAlreadyExists,
//   ErrorResponse,
//   handleError,
// } from "@/app/api/lib/errors";
// import { db } from "@/app/api/lib/db";
// import bcrypt from "bcryptjs";
// import { NextResponse } from "next/server";
// import { logger } from "../../../lib/logger";
// import { sendVerificationEmail } from "../../../lib/mail";
// import {
//   generateVerificationToken,
//   getTokenExpiry,
// } from "../../../helper/verificationTokens";
// import { IndividualSignupRequest, IndividualSignupResponse } from "../types";

// export default async function handler(
//   data: IndividualSignupRequest
// ): Promise<NextResponse<IndividualSignupResponse | ErrorResponse>> {
//   try {
//     const { name, email, password, roleId } = data;

//     logger.info("Signup request received", { email });

//     // Check if user already exists
//     const existingUser = await db.user.findUnique({
//       where: { email },
//       select: { id: true },
//     });

//     if (existingUser) {
//       logger.warn("User already exists", { email });
//       throw new ErrorAlreadyExists("User");
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const verificationToken = generateVerificationToken();

//     logger.info("Verification token generated", { verificationToken });

//     const tokenExpiry = getTokenExpiry();

//     const user = await db.user.create({
//       data: {
//         name,
//         email,
//         verificationToken,
//         verificationTokenExpiry: tokenExpiry,
//         password: hashedPassword,
//         isVerified: false,
//       },
//     });

//     logger.info("User created successfully", { userId: user.id });

//     await sendVerificationEmail(email, verificationToken);

//     const { password: _, ...userDetails } = user;
//     return NextResponse.json(
//       {
//         user: userDetails,
//         message: "User created successfully",
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     logger.error("Signup error", { error: error });
//     return handleError(error);
//   }
// }

 import {
  ErrorAlreadyExists,
  ErrorResponse,
  handleError,
} from "@/app/api/lib/errors";
import { db } from "@/app/api/lib/db";
import { NextResponse } from "next/server";
import { logger } from "../../../lib/logger";
import { sendVerificationEmail } from "../../../lib/mail";
import {
  generateVerificationToken,
  getTokenExpiry,
} from "../../../helper/verificationTokens";
import { redirect } from "next/navigation";
import { IndividualSignupRequest, IndividualSignupResponse } from "../types";

export default async function handler(
  data: IndividualSignupRequest
): Promise<NextResponse<IndividualSignupResponse | ErrorResponse>> {
  try {
    const { name, email, mobileNumber } = data;

     console.log("Signup request received", { email, mobileNumber });

    // 1. Validate required fields
    if (!email || !mobileNumber) {
      throw new Error("Email and mobile number are required");
    }

    // 2. Clean and validate mobile number
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      throw new Error("Invalid Indian mobile number format");
    }

    // 3. Check if email exists
    const existingEmailUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmailUser) {
      throw new ErrorAlreadyExists("User with this email");
    }

    // 4. Find mobile-verified user
    const mobileUser = await db.user.findFirst({
      where: { 
        mobileNumber: cleanedMobile,
        isMobileVerified: true 
      },
    });

    if (!mobileUser) {
      throw new Error("Mobile number not verified. Please complete OTP verification first");
    }

    // 5. Generate email verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    // 6. Complete registration
    const updatedUser = await db.user.update({
      where: { id: mobileUser.id },
      data: {
        name,
        email,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        isVerified: false,
      },
    });

    logger.info("User registration completed", { userId: updatedUser.id });

    // 7. Send verification email
    await sendVerificationEmail(email, verificationToken);

    // 8. Prepare response
    // Exclude password, but include all other required fields for IndividualSignupResponse
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userDetails } = updatedUser;

    return NextResponse.json(
      {
        user: userDetails,
        message: "Registration completed successfully. Please verify your email.",
       
         
      },
      { status: 201 }
    );

    
  } catch (error) {
    logger.error("Signup error", { 
      error: error instanceof Error ? error.message : String(error),
      requestData: data
    });
    return handleError(error);
  }
}