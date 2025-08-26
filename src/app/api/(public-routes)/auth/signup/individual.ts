

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
    if (!mobileNumber) {
      throw new Error("Mobile number is required");
    }

    // 2. Clean and validate mobile number
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      throw new Error("Invalid Indian mobile number format");
    }

    // 1.5. Validate email if provided
    let validatedEmail = null;
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error("Invalid email format");
      }
      validatedEmail = email.trim();
    }
    

    // 3. Check if email exists (only if email provided)
    if (validatedEmail) {
      const existingEmailUser = await db.user.findUnique({
        where: { email: validatedEmail },
        select: { id: true },
      });

      if (existingEmailUser) {
        throw new ErrorAlreadyExists("User with this email");
      }
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
        email ,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        isVerified: false,
      },
    });

    logger.info("User registration completed", { userId: updatedUser.id });
    // After successful signup (individual/organization), add:
const [defaultFolder, rootFile] = await db.$transaction([
  // 1. Create default folder ("My Documents")
  db.fileSystemNode.create({
    data: {
      name: "My Documents",
      type: "FOLDER",
      userId: updatedUser.id, // or updatedUser.id for individual
    },
  }),

  // 2. Create root-level file ("Welcome.docx")
  db.fileSystemNode.create({
    data: {
      name: "Welcome.docx",
      type: "FILE",
      content: "<div>This is a placeholder DOCX file. Upload or generate one to replace it.</div>", // Base64 or placeholder
      userId: updatedUser.id,
    },
  }),
]);

// 3. Create nested file inside the folder ("My Documents/Quick Start.docx")
await db.fileSystemNode.create({
  data: {
    name: "Quick Start.docx",
    type: "FILE",
    content: "<div>This is a placeholder DOCX file. Upload or generate one to replace it. Inside folder</div>", // Base64 or placeholder
    parentId: defaultFolder.id,
    userId: updatedUser.id,
  },
});

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