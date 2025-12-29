import mongoose from "mongoose";
import { z } from "zod";

// Normalizes email to prevent duplicate accounts with varied casing.
// .pipe() method explicitly tells the compiler to clean the string first
// and then validate the email format second.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Invalid email address"));

// Modern standard: Focus on length (12+) over complex character rules
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .max(64, "Password must not exceed 64 characters")
  .refine((val) => !/^(.)\1+$/.test(val), {
    message: "Password is too simple (avoid repeating characters)",
  });

// Validates that a string is a valid MongoDB ObjectId
export const verificationCodeSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid or expired verification link.",
  });

/**
 * FEATURE-SPECIFIC SCHEMAS
 */

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
  password: z.string(), // Don't use full passwordSchema here to allow legacy logins if rules change.
  //  For example If we increase your password length requirements in the future (e.g., from 12 to 16), users with old 12-character passwords would be locked out of their accounts because the login validator would fail before checking the database.
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

/**
 * TYPE INFERENCE
 * These allow you to use 'z.infer' in your services/controllers
 * for 100% type safety without manual type maintenance.
 */
export type RegisterParams = z.infer<typeof registerSchema>;
export type LoginParams = z.infer<typeof loginSchema>;
export type ResetPasswordParams = z.infer<typeof resetPasswordSchema>;
