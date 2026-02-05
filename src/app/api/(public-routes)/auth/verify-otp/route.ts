
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { mobileNumber, otp } = await request.json();

    console.log('Received OTP verification request for:', mobileNumber, otp);

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }

    // Test account (9999999991) is for mobile app only; web must not sign in with it
    const cleanedMobile = String(mobileNumber).replace(/\D/g, '').slice(-10);
    const testMobile = process.env.TEST_MOBILE_NUMBER?.trim().replace(/\D/g, '').slice(-10);
    const allowTestOtp = process.env.ALLOW_TEST_OTP === 'true' || process.env.ALLOW_TEST_OTP === '1';
    if (allowTestOtp && testMobile && cleanedMobile === testMobile) {
      return NextResponse.json(
        { success: false, message: 'This account can only be used to sign in from the mobile app.' },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.individualOtpLogin.findFirst({
      where: { mobileNumber },
      include: { user: true }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'OTP not requested for this number' },
        { status: 400 }
      );
    }

    // Incomplete signup: allow user to sign up again (redirect to signup)
    if (!otpRecord.user.name || !otpRecord.user.isMobileVerified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please complete your signup. You can sign up again with this number.',
          requiresSignup: true,
        },
        { status: 200 }
      );
    }

    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (otpRecord.otpExpiry && new Date() > otpRecord.otpExpiry) {
      await prisma.individualOtpLogin.update({
        where: { id: otpRecord.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json(
        { success: false, message: 'OTP has expired' },
        { status: 400 }
      );
    }

    if (otpRecord.otp !== otp) {
      await prisma.individualOtpLogin.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      });

      const remainingAttempts = 2 - otpRecord.attempts;
      return NextResponse.json(
        {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        },
        { status: 400 }
      );
    }

    await prisma.individualOtpLogin.update({
      where: { id: otpRecord.id },
      data: {
        status: 'VERIFIED',
        otp: null,
        otpExpiry: null
      }
    });

    if (otpRecord.userId) {
      await prisma.user.update({
        where: { id: otpRecord.userId },
        data: { isVerified: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: otpRecord.user?.id,
        name: otpRecord.user?.name,
        email: otpRecord.user?.email,
        mobileNumber: otpRecord.user?.mobileNumber
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'OTP verification failed' },
      { status: 500 }
    );
  }
}
