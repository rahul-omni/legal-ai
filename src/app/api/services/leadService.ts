import { db } from "@/app/api/lib/db";
import { Lead, LeadStatus } from "@prisma/client";
import { ErrorNotFound } from "../lib/errors";
import { Transaction } from "../types";

interface CreateLeadInput {
  userId?: string;
  fullName: string;
  email: string;
  mobile: string;
  subscriptionPlanId?: string;
  bookingId?: string;
  eventDetails?: any;
}

interface UpdateLeadInput {
  status?: LeadStatus;
  subscriptionPlanId?: string;
  bookingId?: string;
  eventDetails?: any;
}

class LeadService {
  /**
   * Create a new lead
   */
  async createLead(
    data: CreateLeadInput,
    tx?: Transaction
  ): Promise<Lead> {
    try {
      const prisma = tx || db;
      return await prisma.lead.create({
        data: {
          userId: data.userId || null,
          fullName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          status: "PENDING",
          subscriptionPlanId: data.subscriptionPlanId || null,
          bookingId: data.bookingId || null,
          eventDetails: data.eventDetails || null,
        },
      });
    } catch (error) {
      console.error("Error creating lead:", error);
      throw new Error("Failed to create lead in the database");
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    try {
      return await db.lead.findUnique({
        where: { id },
        include: {
          subscriptionPlan: true,
          payments: true,
        },
      });
    } catch {
      throw new Error("Failed to find lead in the database");
    }
  }

  /**
   * Get lead by booking ID
   */
  async getLeadByBookingId(bookingId: string): Promise<Lead | null> {
    try {
      return await db.lead.findUnique({
        where: { bookingId },
        include: {
          subscriptionPlan: true,
          payments: true,
        },
      });
    } catch {
      throw new Error("Failed to find lead by booking ID");
    }
  }

  /**
   * Get leads by user ID
   */
  async getLeadsByUserId(userId: string): Promise<Lead[]> {
    try {
      return await db.lead.findMany({
        where: { userId },
        include: {
          subscriptionPlan: true,
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find leads by user ID");
    }
  }

  /**
   * Get leads by email
   */
  async getLeadsByEmail(email: string): Promise<Lead[]> {
    try {
      return await db.lead.findMany({
        where: { email },
        include: {
          subscriptionPlan: true,
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find leads by email");
    }
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    try {
      return await db.lead.findMany({
        where: { status },
        include: {
          subscriptionPlan: true,
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      throw new Error("Failed to find leads by status");
    }
  }

  /**
   * Update lead
   */
  async updateLead(
    id: string,
    data: UpdateLeadInput,
    tx?: Transaction
  ): Promise<Lead> {
    try {
      const prisma = tx || db;
      return await prisma.lead.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.subscriptionPlanId && { subscriptionPlanId: data.subscriptionPlanId }),
          ...(data.bookingId && { bookingId: data.bookingId }),
          ...(data.eventDetails !== undefined && { eventDetails: data.eventDetails }),
        },
      });
    } catch {
      throw new ErrorNotFound("Lead not found");
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    id: string,
    status: LeadStatus,
    tx?: Transaction
  ): Promise<Lead> {
    try {
      const prisma = tx || db;
      return await prisma.lead.update({
        where: { id },
        data: { status },
      });
    } catch {
      throw new ErrorNotFound("Lead not found");
    }
  }

  /**
   * Delete lead (will cascade delete payments)
   */
  async deleteLead(id: string): Promise<Lead> {
    try {
      return await db.lead.delete({
        where: { id },
      });
    } catch {
      throw new ErrorNotFound("Lead not found");
    }
  }
}

// Export default instance for easier usage
export const leadService = new LeadService();

