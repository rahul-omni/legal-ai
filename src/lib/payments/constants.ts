// Payment and Lead Status Constants
// These constants match the Prisma enums defined in schema.prisma

export const LEAD_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SCHEDULED: "SCHEDULED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export const PAYMENT_STATUS = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
