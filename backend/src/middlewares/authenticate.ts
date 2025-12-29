import { RequestHandler } from "express";
import appAssert from "../utils/appAssert.js";
import { HTTP_STATUS } from "../constants/http.js";
import { verifyToken } from "../utils/jwt.js";
import AppErrorCode from "../constants/appErrorCode.js";

/**
 * Middleware to protect routes. Verifies the Access Token stored in cookies.
 */
const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;

  // If access token is missing, just send 401. Don't clear refresh token yet.
  appAssert(
    accessToken,
    HTTP_STATUS.UNAUTHORIZED,
    "Not authorized",
    AppErrorCode.InvalidAccessToken
  );

  const payload = verifyToken("accessToken", accessToken);

  // If token is expired/invalid, send 401.
  // This allows the frontend to catch the 401 and call /auth/refresh.
  appAssert(
    payload,
    HTTP_STATUS.UNAUTHORIZED,
    "Invalid or expired token",
    AppErrorCode.InvalidAccessToken
  );

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;

  next();
};

export default authenticate;
