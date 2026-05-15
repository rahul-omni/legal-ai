import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { handleError, ErrorResponse, ErrorApp } from "../../lib/errors";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface OrderRequest {
  amount: number;
  currency?: string;
}

interface OrderResponse {
  orderId: string;
  keyId: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<OrderResponse | ErrorResponse>> {
  try {
    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ErrorApp(
        "Razorpay credentials are not configured",
        500
      );
    }

    // Parse request body
    const body: OrderRequest = await request.json();
    const { amount, currency = "INR" } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new ErrorApp("Invalid amount. Amount must be greater than 0", 400);
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    // Frontend sends amount in rupees, so we convert to paise
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `rcp_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(
      { orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating Razorpay order:", error);

    const razorpayError = error as { statusCode?: number; error?: { description?: string } };
    if (razorpayError.statusCode === 401) {
      return handleError(
        new ErrorApp(
          "Razorpay authentication failed. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are valid test keys.",
          500
        )
      );
    }

    return handleError(error);
  }
}

