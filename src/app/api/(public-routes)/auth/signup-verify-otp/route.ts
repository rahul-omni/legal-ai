import { NextResponse } from 'next/server';
import { db } from '@/app/api/lib/db';
import { logger } from '../../../lib/logger';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const { mobileNumber, otp } = await request.json();

    // Input validation
    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }

    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    const user = await db.user.findFirst({
      where: { mobileNumber: cleanedMobile },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found. Please request OTP again.' },
        { status: 404 }
      );
    }

    // Debug log to check initial attempts count
    logger.debug('OTP verification attempt', {
      userId: user.id,
      currentAttempts: user.mobileOtpAttempts,
      hasOtp: !!user.otp
    });

    // Check if OTP exists (new fix)
    if (!user.otp) {
      return NextResponse.json(
        { success: false, message: 'No active OTP found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check attempt count with null/undefined safety
    const currentAttempts = user.mobileOtpAttempts ?? 0;
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Check OTP expiry
    if (!user.mobileOtpExpiry || new Date() > user.mobileOtpExpiry) {
      return NextResponse.json(
        { success: false, message: 'OTP expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp !== otp) {
      // Increment attempts
      await db.user.update({
        where: { id: user.id },
        data: { mobileOtpAttempts: currentAttempts + 1 },
      });

      const remainingAttempts = MAX_OTP_ATTEMPTS - (currentAttempts + 1);
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          attemptsRemaining: remainingAttempts
        },
        { status: 400 }
      );
    }

    // Successful verification
    await db.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        mobileOtpExpiry: null,
        mobileOtpAttempts: 0,
        isMobileVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully!',
    });

  } catch (error) {
    logger.error('OTP verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}