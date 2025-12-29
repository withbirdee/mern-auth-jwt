import { CookieOptions, Response } from "express";
import { NODE_ENV } from "../constants/env.js";
import {
  ACCESS_TOKEN_LIFETIME_MINUTES,
  REFRESH_TOKEN_LIFETIME_DAYS,
} from "./jwt.js";

export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
  httpOnly: true,
  // SameSite 'strict' is the most secure for auth tokens to prevent CSRF
  sameSite: "strict",
  // Secure must be true in production to ensure tokens are only sent over HTTPS
  secure: NODE_ENV !== "development",
};

/**
 * Calculates cookie options for the Access Token.
 * Short-lived (30 minutes).
 */
const getAccessTokenOptions = (): CookieOptions => ({
  ...defaults,
  expires: new Date(Date.now() + ACCESS_TOKEN_LIFETIME_MINUTES * 60 * 1000),
});

/**
 * Calculates cookie options for the Refresh Token.
 * Long-lived (30 days) and scoped only to the refresh endpoint.
 */
const getRefreshTokenOptions = (): CookieOptions => ({
  ...defaults,
  expires: new Date(
    Date.now() + REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000
  ),
  path: REFRESH_PATH,
});

type SetAuthCookies = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

/**
 * Attaches authentication tokens to secure HTTP-only cookies.
 */
export function setAuthCookies({
  res,
  accessToken,
  refreshToken,
}: SetAuthCookies) {
  return res
    .cookie("accessToken", accessToken, getAccessTokenOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenOptions());
}

/**
 * Instructs the browser to remove authentication cookies.
 */
export function clearAuthCookies(res: Response) {
  return res
    .clearCookie("accessToken", { ...defaults })
    .clearCookie("refreshToken", { ...defaults, path: REFRESH_PATH });
}
