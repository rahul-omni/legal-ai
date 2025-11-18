import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleError, ErrorResponse, ErrorApp } from "../../lib/errors";

interface VerifyRequest {
  orderCreationId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface VerifyResponse {
  message: string;
  isOk: boolean;
}

/**
 * Generate signature for payment verification
 */
const generatedSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string
): string => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keySecret) {
    throw new ErrorApp(
      "Razorpay key secret is not defined in environment variables",
      500
    );
  }

  const sig = crypto
    .createHmac("sha256", keySecret)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex");
  
  return sig;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<VerifyResponse | ErrorResponse>> {
  try {
    // Validate environment variable
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new ErrorApp(
        "Razorpay key secret is not configured",
        500
      );
    }

    // Parse request body
    const body: VerifyRequest = await request.json();
    const { orderCreationId, razorpayPaymentId, razorpaySignature } = body;

    // Validate required fields
    if (!orderCreationId || !razorpayPaymentId || !razorpaySignature) {
      throw new ErrorApp(
        "Missing required fields: orderCreationId, razorpayPaymentId, or razorpaySignature",
        400
      );
    }

    // Generate signature for verification
    const signature = generatedSignature(orderCreationId, razorpayPaymentId);

    // Compare signatures
    if (signature !== razorpaySignature) {
      return NextResponse.json(
        {
          message: "payment verification failed",
          isOk: false,
        },
        { status: 400 }
      );
    }

    // Payment verified successfully
    return NextResponse.json(
      {
        message: "payment verified successfully",
        isOk: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return handleError(error);
  }
}

