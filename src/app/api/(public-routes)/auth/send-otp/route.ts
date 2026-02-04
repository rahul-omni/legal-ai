
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request
    const requestBody = await request.json();
    console.log("Request body:", requestBody);

    if (!requestBody.mobileNumber) {
      return NextResponse.json(
        { success: false, message: 'Mobile number is required' },
        { status: 400 }
      );
    }

    const cleanedMobile = requestBody.mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Indian mobile number' },
        { status: 400 }
      );
    }

    // 2. Check user exists
    const user = await prisma.user.findFirst({
      where: { mobileNumber: cleanedMobile }
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Mobile number not registered' },
        { status: 404 }
      );
    }

    // 2.5. Incomplete signup: allow user to sign up again (don't block with 428)
    if (!user.name || !user.isMobileVerified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please complete your signup. You can sign up again with this number.',
          requiresSignup: true,
        },
        { status: 200 }
      );
    }

    // 3. Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    const otpRecord = await prisma.individualOtpLogin.upsert({
      where: { mobileNumber: cleanedMobile },
      update: { 
        otp,
        otpExpiry,
        attempts: 0,
        status: 'PENDING'
      },
      create: {
        mobileNumber: cleanedMobile,
        otp,
        otpExpiry,
        attempts: 0,
        status: 'PENDING',
        userId: user.id
      }
    });

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

    return NextResponse.json({
      success: true,
      data: {
        id: otpRecord.id,
        mobileNumber: cleanedMobile,
        status: 'PENDING'
      },
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: process.env.NODE_ENV === 'development'
          ? `Debug: ${error instanceof Error ? error.message : 'Unknown error'}`
          : 'Failed to send OTP'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}