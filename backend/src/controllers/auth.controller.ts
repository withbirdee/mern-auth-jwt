import { Request, Response } from "express";
import {
  registerSchema,
  loginSchema,
  emailSchema,
  verificationCodeSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import {
  createUserAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import { HTTP_STATUS } from "../constants/http.js";
import { verifyToken } from "../utils/jwt.js";
import appAssert from "../utils/appAssert.js";
import SessionModel from "../models/session.model.js";

/**
 * Handles user registration and initializes a secure session.
 */
export async function registerHandler(req: Request, res: Response) {
  // Validate input and capture client device metadata
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  const { user, accessToken, refreshToken } = await createUserAccount(request);

  // Set HTTP-only cookies and return the created user profile
  return setAuthCookies({ res, accessToken, refreshToken })
    .status(HTTP_STATUS.CREATED)
    .json(user);
}

/**
 * Consumes a verification code to verify the user's account.
 */
export async function verifyEmailHandler(req: Request, res: Response) {
  // Validate that the URL parameter is a correctly formatted verification token
  const validCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(validCode);

  return res.status(HTTP_STATUS.OK).json({
    message: "Email verified successfully.",
  });
}

/**
 * Verifies credentials and establishes a new authenticated session.
 */
export async function loginHandler(req: Request, res: Response) {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken } = await loginUser(request);

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(HTTP_STATUS.OK)
    .json({ message: "Login successful" });
}

/**
 * Terminates the user session and clears authentication cookies.
 */
export async function logoutHandler(req: Request, res: Response) {
  const accessToken = req.cookies.accessToken as string | undefined;
  const payload = verifyToken("accessToken", accessToken || "");

  if (payload) {
    // Immediate server-side invalidation of the session
    await SessionModel.findByIdAndDelete(payload.sessionId);
  }

  /**
   * Note: If payload is missing/expired, the session's TTL index
   * will eventually handle the database cleanup automatically.
   */

  // Always clear cookies to ensure the client is logged out locally
  return clearAuthCookies(res)
    .status(HTTP_STATUS.OK)
    .json({ message: "Logout successful" });
}

/**
 * Handles the rotation of authentication tokens using a valid refresh token.
 */
export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies.refreshToken as string | undefined;
  // Fail fast if the cookie is missing
  appAssert(token, HTTP_STATUS.UNAUTHORIZED, "Missing refresh token");

  const payload = verifyToken("refreshToken", token);

  /**
   * If verification fails (invalid or expired), we must clear the client's
   * cookies to prevent the browser from sending broken tokens repeatedly.
   */
  if (!payload) {
    return clearAuthCookies(res)
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ message: "Invalid or expired refresh token" });
  }

  const { accessToken, refreshToken } = await refreshUserAccessToken(
    payload.sessionId
  );

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(HTTP_STATUS.OK)
    .json({ message: "Access token refreshed" });
}

/**
 * Initiates the password reset flow by sending a verification link to the user.
 */
export async function sendPasswordResetHandler(req: Request, res: Response) {
  const email = emailSchema.parse(req.body.email);

  await sendPasswordResetEmail(email);

  /**
   * ANTI-ENUMERATION SECURITY:
   * We return a generic 200 OK regardless of whether the email was found.
   * This prevents malicious actors from guessing registered email addresses
   * by observing differences in the API response.
   */
  return res.status(HTTP_STATUS.OK).json({
    message:
      "If an account exists with that email, a reset link has been sent.",
  });
}

/**
 * Processes the completion of a password reset request.
 */
export async function resetPasswordHandler(req: Request, res: Response) {
  // Validate the combined code and body data against the schema
  const request = resetPasswordSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookies(res)
    .status(HTTP_STATUS.OK)
    .json({ message: "Password was reset successfully" });
}
