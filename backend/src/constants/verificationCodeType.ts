export const VerificationCode = {
  EmailVerification: "email_verification",
  PasswordReset: "password_reset",
} as const;

// Create a type from the object values for TypeScript interfaces
export type VerificationCodeType =
  (typeof VerificationCode)[keyof typeof VerificationCode];
