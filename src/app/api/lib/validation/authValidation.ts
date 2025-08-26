import { z } from "zod";

export const individualSignupSchema1= z.object({
  name: z
    .string()
    .min(1)
    .optional()
    .transform((val) => val?.trim().toLowerCase()),
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(8),
  roleId: z.string().uuid().optional(),
});

export const individualSignupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((val) => val?.trim()),
    email: z
    .union([
      z.string().email("Invalid email address"),
      z.literal(""),
      z.undefined()
    ])
    .optional()
    .transform((val) => {
      if (!val || val === "") return undefined;
      return val.toLowerCase().trim();
    }),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  roleId: z.string().uuid().optional(),
});

export const organizationSignupSchema = z.object({
  orgName: z
    .string()
    .min(1)
    .transform((val) => val.trim().toLowerCase()),
  adminName: z
    .string()
    .min(1)
    .transform((val) => val.trim().toLowerCase()),
  email: z
    .string()
    .email()
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(8),
  roleId: z.string().uuid().optional(),
});

export const logInSchema1= z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const logInSchema = z
  .object({
    email: z.string().optional(),
    password: z.string().optional(),
    mobileNumber: z.string().optional(),
    otp: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isEmailLogin = !!data.email && !!data.password;
    const isOtpLogin = !!data.mobileNumber && !!data.otp;

    if (!isEmailLogin && !isOtpLogin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either email & password or mobileNumber & otp",
        path: [],
      });
    }

    if (isEmailLogin) {
      if (!data.email?.includes("@")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email",
          path: ["email"],
        });
      }
      if ((data.password?.length ?? 0) < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 8 characters",
          path: ["password"],
        });
      }
    }

    if (isOtpLogin) {
      if (!/^\d{10}$/.test(data.mobileNumber ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid mobile number",
          path: ["mobileNumber"],
        });
      }

      if (!/^\d{4,6}$/.test(data.otp ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid OTP",
          path: ["otp"],
        });
      }
    }
  });
