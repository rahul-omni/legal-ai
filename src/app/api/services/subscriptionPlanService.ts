import { db } from "@/app/api/lib/db";
import { SubscriptionPlan } from "@prisma/client";
import { ErrorNotFound } from "../lib/errors";

class SubscriptionPlanService {
  /**
   * Get all active subscription plans
   */
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db.subscriptionPlan.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          price: "asc",
        },
      });
    } catch {
      throw new Error("Failed to fetch subscription plans");
    }
  }

  /**
   * Get all subscription plans (including inactive)
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db.subscriptionPlan.findMany({
        orderBy: {
          price: "asc",
        },
      });
    } catch {
      throw new Error("Failed to fetch subscription plans");
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    try {
      return await db.subscriptionPlan.findUnique({
        where: { id },
      });
    } catch {
      throw new Error("Failed to find subscription plan");
    }
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(data: {
    title: string;
    description?: string;
    features: string[];
    discountedPrice: number;
    discounted: number;
    price: number;
    duration?: number;
    isActive?: boolean;
  }): Promise<SubscriptionPlan> {
    try {
      return await db.subscriptionPlan.create({
        data: {
          title: data.title,
          description: data.description || null,
          features: data.features,
          discountedPrice: data.discountedPrice,
          discounted: data.discounted,
          price: data.price,
          duration: data.duration || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw new Error("Failed to create subscription plan");
    }
  }

  /**
   * Update subscription plan
   */
  async updatePlan(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      features: string[];
      discountedPrice: number;
      discounted: number;
      price: number;
      duration: number;
      isActive: boolean;
    }>
  ): Promise<SubscriptionPlan> {
    try {
      return await db.subscriptionPlan.update({
        where: { id },
        data,
      });
    } catch {
      throw new ErrorNotFound("Subscription plan not found");
    }
  }

  /**
   * Delete subscription plan
   */
  async deletePlan(id: string): Promise<SubscriptionPlan> {
    try {
      return await db.subscriptionPlan.delete({
        where: { id },
      });
    } catch {
      throw new ErrorNotFound("Subscription plan not found");
    }
  }
}

// Export default instance for easier usage
export const subscriptionPlanService = new SubscriptionPlanService();

