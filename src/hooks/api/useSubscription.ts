import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/app/apiServices";
import { useUserContext } from "@/context/userContext";
import { UserSubscription } from "@/reducer/userReducer";

interface SubscriptionResponse {
  success: boolean;
  subscription: UserSubscription | null;
  hasActiveSubscription: boolean;
}

export default function useSubscription() {
  const { userState, dispatchUser } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription from API and update context
  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<SubscriptionResponse>(
        "/user-subscriptions"
      );
      const { subscription, hasActiveSubscription } = response.data;

      dispatchUser({
        type: "FETCH_SUBSCRIPTION",
        payload: {
          subscription,
          hasActiveSubscription,
        },
      });

      return { subscription, hasActiveSubscription };
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || "Failed to fetch subscription";
      setError(errorMessage);
      // Set to null if error (user might not have subscription)
      dispatchUser({
        type: "FETCH_SUBSCRIPTION",
        payload: {
          subscription: null,
          hasActiveSubscription: false,
        },
      });
      return { subscription: null, hasActiveSubscription: false };
    } finally {
      setIsLoading(false);
    }
  }, [dispatchUser]);

  // Refresh subscription (useful after payment)
  const refreshSubscription = useCallback(async () => {
    return await fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription: userState.subscription,
    hasActiveSubscription: userState.hasActiveSubscription || false,
    isLoading,
    error,
    fetchSubscription,
    refreshSubscription,
  };
}

/**
 * Hook to easily check subscription status and plan details
 * Returns convenient methods to check subscription features
 */
export function useSubscriptionStatus() {
  const { userState } = useUserContext();
  const subscription = userState.subscription;
  const hasActiveSubscription = userState.hasActiveSubscription || false;

  const getPlanTitle = () => {
    return subscription?.subscriptionPlan?.title || null;
  };

  const getPlanFeatures = () => {
    return subscription?.subscriptionPlan?.features || [];
  };

  const getPlanDuration = () => {
    return subscription?.subscriptionPlan?.duration || null;
  };

  const isPlanActive = () => {
    return hasActiveSubscription && subscription?.status === "ACTIVE";
  };

  const getDaysRemaining = () => {
    if (!subscription || !isPlanActive()) return 0;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const hasFeature = (featureName: string) => {
    if (!isPlanActive()) return false;
    const features = getPlanFeatures();
    return features.some(
      (f) => f.toLowerCase().includes(featureName.toLowerCase())
    );
  };

  return {
    subscription,
    hasActiveSubscription,
    isPlanActive: isPlanActive(),
    planTitle: getPlanTitle(),
    planFeatures: getPlanFeatures(),
    planDuration: getPlanDuration(),
    daysRemaining: getDaysRemaining(),
    hasFeature,
  };
}


