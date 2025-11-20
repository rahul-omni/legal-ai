"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import Button from "./ui/Button";
import { toast } from "react-hot-toast";
import { useUserContext } from "@/context/userContext";

const bookingSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  discountedPrice: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  onBookingSuccess?: (leadId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BookingModal({
  isOpen,
  onClose,
  plan,
  onBookingSuccess,
}: BookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const { userState } = useUserContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  // Auto-fill form with user data when modal opens
  useEffect(() => {
    if (isOpen && userState.user) {
      const defaultValues: Partial<BookingFormData> = {};
      
      // Only set values if they exist in user data
      if (userState.user.name) {
        defaultValues.fullName = userState.user.name;
      }
      if (userState.user.email) {
        defaultValues.email = userState.user.email;
      }
      if (userState.user.mobileNumber) {
        defaultValues.mobile = userState.user.mobileNumber;
      }
      
      // Reset form with default values only if at least one value exists
      if (Object.keys(defaultValues).length > 0) {
        reset(defaultValues);
      }
    } else if (isOpen && !userState.user) {
      // Reset form to empty if no user data
      reset();
    }
  }, [isOpen, userState.user, reset]);

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      setIsLoadingScript(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        setIsLoadingScript(false);
      };
      script.onerror = () => {
        setIsLoadingScript(false);
        toast.error("Failed to load payment gateway");
      };
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      setIsLoadingScript(false);
    }
  }, [isOpen]);

  const createOrderId = async (amount: number): Promise<string | null> => {
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount, // Send amount in rupees, backend will convert to paise
          currency: "INR",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      console.error("Error creating order ID:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create order");
      return null;
    }
  };

  const createLead = async (formData: BookingFormData): Promise<string | null> => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          subscriptionPlanId: plan?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lead");
      }

      const data = await response.json();
      return data.lead.id;
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create booking");
      return null;
    }
  };

  const processPayment = async (
    leadId: string,
    orderId: string,
    amount: number
  ) => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      name: "Legal AI",
      description: `Payment for ${plan?.title} Plan`,
      order_id: orderId,
      handler: async function (response: any) {
        try {
          // Verify payment
          const verifyResponse = await fetch("/api/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderCreationId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyData.isOk) {
            throw new Error("Payment verification failed");
          }

          // Create payment record
          const paymentResponse = await fetch("/api/payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leadId,
              subscriptionPlanId: plan?.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              status: "SUCCESS",
              request: {
                orderCreationId: orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              response: verifyData,
            }),
          });

          if (!paymentResponse.ok) {
            throw new Error("Failed to save payment record");
          }

          // Update lead status
          await fetch("/api/leads", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: leadId,
              status: "CONFIRMED",
            }),
          });

          toast.success("Payment successful! Booking confirmed.");
          onBookingSuccess?.(leadId);
          reset();
          onClose();
        } catch (error) {
          console.error("Payment processing error:", error);
          toast.error("Payment verification failed. Please contact support.");

          // Save failed payment
          try {
            await fetch("/api/payments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                leadId,
                subscriptionPlanId: plan?.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                status: "FAILED",
                request: {
                  orderCreationId: orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
                response: { error: "Verification failed" },
              }),
            });
          } catch (err) {
            console.error("Failed to save payment record:", err);
          }
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: userState.user?.name || "",
        email: userState.user?.email || "",
        contact: userState.user?.mobileNumber || "",
      },
      theme: {
        color: "#2861E2", // Primary color
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
        },
      },
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.on("payment.failed", async function (response: any) {
      try {
        console.error("Payment failed:", response);
        toast.error(response.error?.description || "Payment failed");

        // Save failed payment to database
        try {
          const failedPaymentResponse = await fetch("/api/payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              leadId,
              subscriptionPlanId: plan?.id,
              razorpayPaymentId: response.error?.metadata?.payment_id || null,
              razorpayOrderId: orderId,
              status: "FAILED",
              request: {
                orderCreationId: orderId,
                error: response.error,
              },
              response: {
                error: response.error?.description || "Payment failed",
                code: response.error?.code,
                source: response.error?.source,
                step: response.error?.step,
                reason: response.error?.reason,
              },
            }),
          });

          if (!failedPaymentResponse.ok) {
            console.error("Failed to save failed payment record");
          } else {
            console.log("Failed payment record saved successfully");
          }
        } catch (err) {
          console.error("Error saving failed payment:", err);
        }
      } catch (error) {
        console.error("Error handling payment failure:", error);
      } finally {
        setIsProcessing(false);
      }
    });

    paymentObject.open();
  };

  const onSubmit = async (formData: BookingFormData) => {
    if (!plan) {
      toast.error("Please select a plan");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create lead
      const leadId = await createLead(formData);
      if (!leadId) {
        setIsProcessing(false);
        return;
      }

      // Step 2: Create order (skip if free plan)
      if (plan.discountedPrice === 0) {
        // Free plan - no payment needed
        await fetch("/api/leads", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: leadId,
            status: "CONFIRMED",
          }),
        });

        toast.success("Booking confirmed! Free plan activated.");
        onBookingSuccess?.(leadId);
        reset();
        onClose();
        setIsProcessing(false);
        return;
      }

      // Step 3: Create Razorpay order
      const orderId = await createOrderId(plan.discountedPrice);
      if (!orderId) {
        setIsProcessing(false);
        return;
      }

      // Step 4: Process payment
      await processPayment(leadId, orderId, plan.discountedPrice);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!plan) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Book ${plan.title} Plan`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Plan Summary */}
        <div className="bg-background-dark p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-text">{plan.title}</p>
              <p className="text-sm text-text-light">
                {plan.discountedPrice === 0
                  ? "Free"
                  : `${formatPrice(plan.discountedPrice)} per month`}
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Full Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            {...register("fullName")}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter your full name"
            disabled={isProcessing}
          />
          {errors.fullName && (
            <p className="text-error text-xs mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter your email"
            disabled={isProcessing}
          />
          {errors.email && (
            <p className="text-error text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Mobile Number <span className="text-error">*</span>
          </label>
          <input
            type="tel"
            {...register("mobile")}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter your mobile number"
            disabled={isProcessing}
          />
          {errors.mobile && (
            <p className="text-error text-xs mt-1">{errors.mobile.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isProcessing}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isProcessing || isLoadingScript}
            loading={isProcessing}
            fullWidth
          >
            {plan.discountedPrice === 0 ? "Confirm Booking" : "Proceed to Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

