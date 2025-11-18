"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/app/apiServices";
import Button from "./ui/Button";
import { Check, Clock, Sparkles } from "lucide-react";
import { BookingModal } from "./BookingModal";
import useSubscription, { useSubscriptionStatus } from "@/hooks/api/useSubscription";
import Header from "./ui/Header";

interface SubscriptionPlan {
  id: string;
  title: string;
  description: string | null;
  features: string[];
  discountedPrice: number;
  discounted: number;
  price: number;
  duration: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionsResponse {
  success: boolean;
  plans: SubscriptionPlan[];
  count: number;
}

export function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { refreshSubscription } = useSubscription();
  const { subscription, hasActiveSubscription } = useSubscriptionStatus();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<SubscriptionsResponse>("/subscriptions?active=true");
      setPlans(response.data.plans);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setError("Failed to load subscription plans. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (originalPrice: number, discountedPrice: number) => {
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // const calculatePricePerMonth = (price: number, durationDays: number | null): number => {
  //   if (!durationDays || durationDays === 0) {
  //     return price; // If no duration, assume monthly
  //   }
  //   // Calculate price per month based on duration in days
  //   return (price / durationDays) * 30; // 30 days per month
  // };

  const formatDuration = (days: number | null): string => {
    if (!days) return "";
    if (days === 30) return "1 month";
    if (days === 90) return "3 months";
    if (days === 180) return "6 months";
    if (days === 365) return "1 year";
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} ${months === 1 ? "month" : "months"}`;
    }
    return `${months} months ${remainingDays} days`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-light">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-error mb-4 text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold text-text mb-2">Error Loading Plans</h3>
          <p className="text-text-light mb-4">{error}</p>
          <Button onClick={fetchSubscriptions} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-muted mb-4 text-4xl">📋</div>
          <h3 className="text-lg font-semibold text-text mb-2">No Plans Available</h3>
          <p className="text-text-light">There are no subscription plans available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <Header headerTitle="Subscription Plans" subTitle="Choose the perfect plan for your legal consultation needs" />
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {plans.map((plan, index) => {
            const discount = calculateDiscount(plan.price, plan.discountedPrice);
            
            // Check if this is the current plan
            const isFreePlan = plan.discountedPrice === 0;
            const isCurrentPlan = 
              (hasActiveSubscription && subscription?.subscriptionPlanId === plan.id) ||
              (!hasActiveSubscription && isFreePlan);
            const isDisabled = isCurrentPlan;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg h-full flex flex-col ${
                  isCurrentPlan
                    ? "border-primary shadow-md scale-105 ring-2 ring-primary ring-opacity-50"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-primary text-white px-3 py-0.5 rounded-full text-xs font-semibold shadow-md">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Discount Badge */}
                {discount > 0 && plan.discountedPrice > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-success text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      {discount}% OFF
                    </span>
                  </div>
                )}
                {/* Free Badge */}
                {plan.discountedPrice === 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-success text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      FREE
                    </span>
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  {/* Plan Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-lg font-semibold text-text">{plan.title}</h3>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-text-light">{plan.description}</p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      {plan.discountedPrice === 0 ? (
                        <span className="text-2xl font-bold text-success">Free</span>
                      ) : (
                        <span className="text-2xl font-bold text-text">
                          {formatPrice(plan.discountedPrice)}
                        </span>
                      )}
                      {plan.discountedPrice < plan.price && plan.discountedPrice > 0 && (
                        <span className="text-sm text-text-light line-through">
                          {formatPrice(plan.price)}
                        </span>
                      )}
                      <span className="text-sm text-text-light">per month</span>
                    </div>
                    
                    {plan.duration && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-text-light">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Valid for {formatDuration(plan.duration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="mb-4 flex-1">
                    <h4 className="text-xs font-semibold text-text mb-2">Features:</h4>
                    <ul className="space-y-1.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-text-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant={isCurrentPlan ? "secondary" : "primary"}
                    size="md"
                    fullWidth
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedPlan(plan);
                        setIsBookingModalOpen(true);
                      }
                    }}
                  >
                    {isCurrentPlan ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-light">
            All plans include secure payment processing via Razorpay. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onBookingSuccess={async (leadId) => {
          console.log("Booking successful, lead ID:", leadId);
          // Refresh subscription after successful payment
          await refreshSubscription();
          // You can redirect or show success page here
        }}
      />
    </div>
  );
}

