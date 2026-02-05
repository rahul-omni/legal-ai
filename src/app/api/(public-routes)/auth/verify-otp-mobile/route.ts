import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken } from '@/app/api/lib/jwt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { mobileNumber, otp } = await request.json();

    console.log('Received Mobile OTP verification request for:', mobileNumber);

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'Mobile number and OTP are required' },
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

    // Incomplete signup: allow user to sign up again (redirect to signup, don't issue JWT)
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

    // Test account (app only): accept fixed OTP when ALLOW_TEST_OTP is set (even if DB had random OTP)
    const cleanedMobile = String(mobileNumber).replace(/\D/g, '').slice(-10);
    const testMobile = process.env.TEST_MOBILE_NUMBER?.trim().replace(/\D/g, '').slice(-10);
    const fixedTestOtp = (process.env.TEST_OTP || '123456').trim().slice(0, 6);
    const isTestAccount = process.env.ALLOW_TEST_OTP === 'true' || process.env.ALLOW_TEST_OTP === '1';
    const otpMatches = isTestAccount && testMobile && cleanedMobile === testMobile && String(otp ?? '').trim() === fixedTestOtp;

    if (otpMatches) {
      // Accept test OTP; continue to issue tokens below
    } else if (otpRecord.otp !== otp) {
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

    // Mark OTP as verified
    await prisma.individualOtpLogin.update({
      where: { id: otpRecord.id },
      data: {
        status: 'VERIFIED',
        otp: null,
        otpExpiry: null
      }
    });

    // Update user verification status
    if (otpRecord.userId) {
      await prisma.user.update({
        where: { id: otpRecord.userId },
        data: { isVerified: true }
      });
    }

    const user = otpRecord.user;

    // Generate JWT tokens for mobile (stateless)
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
    });
    
    const refreshToken = generateRefreshToken(user.id);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber
      }
    });

  } catch (error) {
    console.error('Mobile OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'OTP verification failed' },
      { status: 500 }
    );
  }
}

