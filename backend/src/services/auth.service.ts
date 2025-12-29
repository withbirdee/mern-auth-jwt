import { HTTP_STATUS } from "../constants/http.js";
import SessionModel from "../models/session.model.js";
import UserModel from "../models/user.model.js";
import VerificationCodeModel from "../models/verificationCode.model.js";
import appAssert from "../utils/appAssert.js";
import { signToken } from "../utils/jwt.js";
import {
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date.js";
import { VerificationCode } from "../constants/verificationCodeType.js";
import { NODE_ENV, ORIGIN_APP } from "../constants/env.js";
import sendMail from "../utils/sendMail.js";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplate.js";
import {
  LoginParams,
  RegisterParams,
  ResetPasswordParams,
} from "../controllers/auth.schema.js";

/**
 * Creates a new user account, generates a verification token,
 * and initiates an authenticated session.
 */
export async function createUserAccount(request: RegisterParams) {
  const { email, password, userAgent } = request;

  // Ensure unique identity by checking for existing email records
  const userExist = await UserModel.exists({ email });
  appAssert(!userExist, HTTP_STATUS.CONFLICT, "Email is already registered.");

  // New user to the database
  const user = await UserModel.create({ email, password, userAgent });
  const userId = user._id.toString();

  // Generate a one-time verification token for email validation
  const verificationCodeDocument = await VerificationCodeModel.create({
    userId,
    type: VerificationCode.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  // Construct the secure verification link
  const url = `${ORIGIN_APP}/auth/email/verify/${verificationCodeDocument._id}`;

  // Notify the user via email. Failures are logged but do not block the registration flow.
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });
  if (error) console.error("Registration email failed to send:", { error });

  // Create an active session and issue JWTs for immediate authentication
  const session = await SessionModel.create({ userId, userAgent });
  const sessionId = session._id.toString();

  const accessToken = signToken("accessToken", { userId, sessionId });
  const refreshToken = signToken("refreshToken", { sessionId });

  return { user, accessToken, refreshToken };
}

/**
 * Consumes a verification code to permanently activate a user's account.
 */
export async function verifyEmail(code: string) {
  // Retrieve the token and ensure it matches the correct verification intent
  const verificationCodeDocument = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCode.EmailVerification,
  });
  appAssert(
    verificationCodeDocument,
    HTTP_STATUS.NOT_FOUND,
    "Invalid or expired verification link."
  );

  // Validate token lifespan; perform proactive cleanup if expired
  const isExpired = verificationCodeDocument.expiresAt < new Date();
  if (isExpired) {
    await verificationCodeDocument.deleteOne();
    appAssert(
      false,
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid or expired verification link."
    );
  }

  const verifiedUser = await UserModel.findByIdAndUpdate(
    verificationCodeDocument.userId,
    { verified: true },
    { new: true }
  );
  appAssert(verifiedUser, HTTP_STATUS.NOT_FOUND, "User not found");

  await verificationCodeDocument.deleteOne();

  return { user: verifiedUser };
}

/**
 * Authenticates a user's identity and creates a persistent session record.
 */
export async function loginUser(request: LoginParams) {
  const { email, password, userAgent } = request;

  // Locate user and explicitly select the sensitive password field for comparison
  const user = await UserModel.findOne({ email }).select("+password");
  appAssert(user, HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");

  // Perform secure cryptographic password comparison
  const isValid = await user.comparePassword(password);
  appAssert(isValid, HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");

  const userId = user._id.toString();

  // Establish a new session to track the user's login state and device
  const session = await SessionModel.create({ userId, userAgent });
  const sessionId = session._id.toString();

  // Generate tokens to facilitate subsequent authenticated requests
  const accessToken = signToken("accessToken", { userId, sessionId });
  const refreshToken = signToken("refreshToken", { sessionId });

  return { user, accessToken, refreshToken };
}

/**
 * Refreshes the user's session and generates a new pair of JWTs.
 *
 * DESIGN CHOICE: This function always generates a new refreshToken JWT even if
 * the database session is not extended. This prevents a bug where
 * the database session is technically alive, but the browser's JWT/Cookie
 * expires because its internal 'exp' claim was never updated.
 */
export async function refreshUserAccessToken(sessionId: string) {
  const session = await SessionModel.findById(sessionId);
  appAssert(
    session && session.expiresAt > new Date(),
    HTTP_STATUS.UNAUTHORIZED,
    "Session expired or not found"
  );

  /**
   * SLIDING SESSION LOGIC:
   * We only perform a database write if the session is nearing its end (within 24h).
   * This significantly reduces DB load by avoiding unnecessary updates on every refresh.
   */
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timeRemaining = session.expiresAt.getTime() - Date.now();

  if (timeRemaining < ONE_DAY_MS) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  const userId = session.userId.toString();

  /**
   * IMPORTANT: Always sign new tokens.
   * 1. AccessToken: Standard rotation.
   * 2. RefreshToken: We issue a fresh JWT to refresh the 'exp' claim in the user's
   *    cookie, keeping the JWT lifetime synchronized with the DB session.
   */
  const accessToken = signToken("accessToken", { userId, sessionId });
  const refreshToken = signToken("refreshToken", { sessionId });

  return { accessToken, refreshToken };
}

export async function sendPasswordResetEmail(email: string) {
  const user = await UserModel.findOne({ email });

  /**
   * SECURITY: We use appAssert with HTTP_STATUS.OK to prevent attackers
   * from "guessing" which emails are registered.
   */
  appAssert(
    user,
    HTTP_STATUS.OK,
    "If an account exists with that email, a reset link has been sent."
  );

  /**
   * Optional: Before creating a new code, we could proactively delete
   * any existing 'PasswordReset' codes for this user to prevent
   * document accumulation in the database.
   */
  await VerificationCodeModel.deleteMany({
    userId: user._id,
    type: VerificationCode.PasswordReset,
  });

  // Create a short-lived verification record (e.g., 1 hour)
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCode.PasswordReset,
    expiresAt: oneHourFromNow(),
  });

  /**
   * CONSTRUCT RESET URL:
   * We only pass the unique ID. We do not pass 'email' or 'expiresAt' in
   * the URL to prevent parameter tampering or info leakage.
   */
  const url = `${ORIGIN_APP}/auth/password/reset?code=${verificationCode._id}`;

  // Dispatch the email. Failures are logged but do not change the user-facing response.
  const { error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });

  if (error) {
    console.error("Password reset email failed to send:", { error });
  }

  return {
    url: NODE_ENV === "development" ? url : undefined,
  };
}

/**
 * Verifies the reset code, updates the user password, and revokes all active sessions.
 */
export async function resetPassword({
  verificationCode,
  newPassword,
}: ResetPasswordParams) {
  const verificationCodeDocument = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCode.PasswordReset,
  });
  appAssert(
    verificationCodeDocument && verificationCodeDocument.expiresAt > new Date(),
    HTTP_STATUS.UNAUTHORIZED,
    "Invalid or expired verification code"
  );

  const user = await UserModel.findById(verificationCodeDocument.userId);
  appAssert(user, HTTP_STATUS.NOT_FOUND, "User not found");

  // Mongoose 'pre-save' middleware will handle the hashing of this password
  user.password = newPassword;
  await user.save();

  await SessionModel.deleteMany({ userId: user._id });
  await verificationCodeDocument.deleteOne();

  return { user };
}
