import { NextResponse } from 'next/server';
import { db } from '@/app/api/lib/db';
import { logger } from '../../../lib/logger';

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      logger.error("Invalid JSON payload", { error: e });
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { mobileNumber } = requestBody;
    logger.debug("Request received", { mobileNumber });

    // 2. Validate mobile number presence
    if (!mobileNumber) {
      return NextResponse.json(
        { success: false, message: 'Mobile number is required' },
        { status: 400 }
      );
    }

    // 3. Clean and validate mobile format
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid Indian mobile number. Must be 10 digits starting with 6-9' 
        },
        { status: 400 }
      );
    }

    // 4. Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { mobileNumber: cleanedMobile },
    });

    if (existingUser) {
      logger.warn("Duplicate registration attempt", { mobileNumber: cleanedMobile });
      return NextResponse.json(
        { 
          success: false, 
          message: 'Mobile number already registered. Please sign in instead.' 
        },
        { status: 409 } // 409 Conflict is more appropriate for duplicate resources
      );
    }

    // 5. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    logger.debug("Generated OTP", { otp, otpExpiry });

    // 6. Create user record with OTP
    const user = await db.user.create({
      data: {
        mobileNumber: cleanedMobile,
        email:   `${cleanedMobile}@example.com`, // Placeholder email, update as needed
           otp : otp,
        mobileOtpExpiry: otpExpiry,
        mobileOtpAttempts: 0,
        countryCode: "+91", // Default country code
        isMobileVerified: false,
      },
    });

    logger.info("User record created for OTP", { userId: user.id });

    // 7. Send OTP via MSG91 in production
      // 4. Send OTP via MSG91 Flow API (using your exact cURL parameters)
    if (process.env.NODE_ENV === 'production' || process.env.USE_MSG91_IN_DEV === 'true' || process.env.NODE_ENV === 'development') {
      const msg91Response = await fetch("https://control.msg91.com/api/v5/flow?authkey=446930Atbcmx9iY0FG67fe0a32P1&accept=application%2Fjson&content-type=application%2Fjson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": "HELLO_APP_HASH=M1pwd3dmUVpKZGd2ZDNLcG1SQnQ1NU0raklPdEhEVXZSSFBuVjNpNDM4WT0%3D; PHPSESSID=8tvt13jd4etkaqc63s8ec4bol0"
        },
        body: JSON.stringify({
          template_id: "685becc9d6fc052a811ab2b3",
          CRQID: `91${cleanedMobile}`,
          recipients: [
            {
              mobiles: `91${cleanedMobile}`,
              var1: otp // Using the generated OTP here
            }
          ]
        })
      });

      if (!msg91Response.ok) {
        const errorData = await msg91Response.json();
        console.error('MSG91 Error:', errorData);
        throw new Error(`MSG91 Error: ${errorData.message || 'Failed to send OTP'}`);
      }

      const result = await msg91Response.json();
      console.log('MSG91 Response:', result);
      
      if (result.type !== "success") {
        throw new Error(`MSG91 Error: ${result.message}`);
      }
    } else {
      // Development mode - just log the OTP
      console.log(`[DEV] OTP for ${cleanedMobile}: ${otp}`);
    }

    // 8. Success response
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        mobileNumber: cleanedMobile,
      //otp: otp,
        otpExpiry: otpExpiry.toISOString()
      }
    });

  } catch (error) {
    logger.error("OTP sending failed", { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: process.env.NODE_ENV === 'development' 
          ? `Error: ${error instanceof Error ? error.message : 'Failed to send OTP'}`
          : 'Failed to send OTP'
      },
      { status: 500 }
    );
  }
}