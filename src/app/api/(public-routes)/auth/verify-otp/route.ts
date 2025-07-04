
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
