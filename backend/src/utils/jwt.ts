import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { JWT_SECRET, JWT_SECRET_REFRESH } from "../constants/env.js";

type AccessTokenPayload = {
  userId: string;
  sessionId: string;
};

type RefreshTokenPayload = {
  sessionId: string;
};

type TokenPayloadMap = {
  accessToken: AccessTokenPayload;
  refreshToken: RefreshTokenPayload;
};

const DEFAULT_OPTIONS: SignOptions & VerifyOptions = {
  audience: ["user"],
};

export const ACCESS_TOKEN_LIFETIME_MINUTES = 30;
export const REFRESH_TOKEN_LIFETIME_DAYS = 30;

/**
 * Signs a new JWT token based on the specified type.
 */
export function signToken<T extends keyof TokenPayloadMap>(
  type: T,
  payload: TokenPayloadMap[T],
  options?: SignOptions
): string {
  const secret = type === "accessToken" ? JWT_SECRET : JWT_SECRET_REFRESH;
  const expiresIn =
    type === "accessToken"
      ? `${ACCESS_TOKEN_LIFETIME_MINUTES}m`
      : `${REFRESH_TOKEN_LIFETIME_DAYS}d`;

  const token = jwt.sign(payload, secret, {
    expiresIn,
    ...DEFAULT_OPTIONS,
    ...options,
  });

  return token;
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Returns null if verification fails.
 */
export function verifyToken<T extends keyof TokenPayloadMap>(
  type: T,
  token: string,
  options?: VerifyOptions
): TokenPayloadMap[T] | null {
  const secret = type === "accessToken" ? JWT_SECRET : JWT_SECRET_REFRESH;
  try {
    const decoded = jwt.verify(token, secret, {
      ...DEFAULT_OPTIONS,
      ...options,
    }) as TokenPayloadMap[T];
    return decoded;
  } catch (error) {
    return null;
  }
}
