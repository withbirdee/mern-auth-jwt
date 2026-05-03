import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Invalid email address"));

// Focus on length (12+) over complex character rules
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .max(64, "Password must not exceed 64 characters");

// Validates a MongoDB ObjectId using Regex
export const verificationCodeSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid or expired verification link.");

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    userAgent: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  userAgent: z.string().optional(),
});

export const resetPasswordSchema = z
  .object({
    verificationCode: verificationCodeSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type RegisterParams = z.infer<typeof registerSchema>;
export type LoginParams = z.infer<typeof loginSchema>;
export type ResetPasswordParams = z.infer<typeof resetPasswordSchema>;
