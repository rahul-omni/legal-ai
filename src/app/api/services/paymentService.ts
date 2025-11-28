import { db } from "@/app/api/lib/db";
import { Payment, PaymentStatus } from "@prisma/client";
import { ErrorNotFound } from "../lib/errors";
import { Transaction } from "../types";
import { userSubscriptionService } from "./userSubscriptionService";

interface CreatePaymentInput {
  userId?: string;
  leadId: string;
  subscriptionPlanId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  status: PaymentStatus;
  request?: any;
  response?: any;
}

class PaymentService {
  /**
   * Create a new payment record
   * If status is SUCCESS and has subscriptionPlanId, creates a subscription
   */
  async createPayment(
    data: CreatePaymentInput,
    tx?: Transaction
  ): Promise<Payment> {
    try {
      const prisma = tx || db;
      const payment = await prisma.payment.create({
        data: {
          userId: data.userId || null,
          leadId: data.leadId,
          subscriptionPlanId: data.subscriptionPlanId || null,
          razorpayPaymentId: data.razorpayPaymentId || null,
          razorpayOrderId: data.razorpayOrderId || null,
          status: data.status,
          request: data.request || null,
          response: data.response || null,
        },
      });

      // Create subscription if payment is successful and has subscription plan
      if (
        payment.status === PaymentStatus.SUCCESS &&
        payment.subscriptionPlanId &&
        payment.userId
      ) {
        try {
          await userSubscriptionService.createSubscription(
            {
              userId: payment.userId,
              subscriptionPlanId: payment.subscriptionPlanId,
              paymentId: payment.id,
              autoRenew: false,
            },
            tx
          );
        } catch (error) {
          console.error("Error creating subscription after payment creation:", error);
          // Don't throw error - payment is already created, subscription creation can be retried
        }
      }

      return payment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw new Error("Failed to create payment in the database");
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      return await db.payment.findUnique({
        where: { id },
        include: {
          lead: true,
          subscriptionPlan: true,
        },
      });
    } catch {
      throw new Error("Failed to find payment in the database");
    }
  }

  /**
   * Get payments by user ID
   */
  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    try {
      return await db.payment.findMany({
        where: { userId },
        include: {
          subscriptionPlan: true,
          lead: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find payments by user ID");
    }
  }

  /**
   * Get payments by lead ID
   */
  async getPaymentsByLeadId(leadId: string): Promise<Payment[]> {
    try {
      return await db.payment.findMany({
        where: { leadId },
        include: {
          subscriptionPlan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find payments by lead ID");
    }
  }

  /**
   * Get payment by Razorpay payment ID
   */
  async getPaymentByRazorpayPaymentId(
    razorpayPaymentId: string
  ): Promise<Payment | null> {
    try {
      return await db.payment.findFirst({
        where: { razorpayPaymentId },
        include: {
          lead: true,
          subscriptionPlan: true,
        },
      });
    } catch {
      throw new Error("Failed to find payment by Razorpay payment ID");
    }
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    try {
      return await db.payment.findMany({
        where: { status },
        include: {
          lead: true,
          subscriptionPlan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find payments by status");
    }
  }

  /**
   * Get successful payment for a lead
   */
  async getSuccessfulPaymentByLeadId(leadId: string): Promise<Payment | null> {
    try {
      return await db.payment.findFirst({
        where: {
          leadId,
          status: "SUCCESS",
        },
        include: {
          subscriptionPlan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find successful payment for lead");
    }
  }

  /**
   * Update payment
   * If status is updated to SUCCESS and has subscriptionPlanId, creates a subscription
   */
  async updatePayment(
    id: string,
    data: Partial<CreatePaymentInput>,
    tx?: Transaction
  ): Promise<Payment> {
    try {
      const prisma = tx || db;
      const existingPayment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!existingPayment) {
        throw new ErrorNotFound("Payment not found");
      }

      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.razorpayPaymentId && { razorpayPaymentId: data.razorpayPaymentId }),
          ...(data.razorpayOrderId && { razorpayOrderId: data.razorpayOrderId }),
          ...(data.request !== undefined && { request: data.request }),
          ...(data.response !== undefined && { response: data.response }),
        },
      });

      // Create subscription if payment is successful and has subscription plan
      if (
        updatedPayment.status === PaymentStatus.SUCCESS &&
        updatedPayment.subscriptionPlanId &&
        updatedPayment.userId &&
        existingPayment.status !== PaymentStatus.SUCCESS // Only create if status changed to SUCCESS
      ) {
        try {
          await userSubscriptionService.createSubscription(
            {
              userId: updatedPayment.userId,
              subscriptionPlanId: updatedPayment.subscriptionPlanId,
              paymentId: updatedPayment.id,
              autoRenew: false,
            },
            tx
          );
        } catch (error) {
          console.error("Error creating subscription after payment success:", error);
          // Don't throw error - payment is already successful, subscription creation can be retried
        }
      }

      return updatedPayment;
    } catch (error) {
      if (error instanceof ErrorNotFound) {
        throw error;
      }
      throw new ErrorNotFound("Payment not found");
    }
  }

  /**
   * Handle payment success - creates subscription if applicable
   * This method can be called explicitly when payment webhook is received
   */
  async handlePaymentSuccess(
    paymentId: string,
    tx?: Transaction
  ): Promise<{ payment: Payment; subscription?: any }> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new ErrorNotFound("Payment not found");
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new Error("Payment is not successful");
      }

      let subscription = null;
      if (payment.subscriptionPlanId && payment.userId) {
        subscription = await userSubscriptionService.createSubscription(
          {
            userId: payment.userId,
            subscriptionPlanId: payment.subscriptionPlanId,
            paymentId: payment.id,
            autoRenew: false,
          },
          tx
        );
      }

      return { payment, subscription };
    } catch (error) {
      console.error("Error handling payment success:", error);
      throw error;
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(id: string): Promise<Payment> {
    try {
      return await db.payment.delete({
        where: { id },
      });
    } catch {
      throw new ErrorNotFound("Payment not found");
    }
  }
}

// Export default instance for easier usage
export const paymentService = new PaymentService();

