import { Request, Response } from "express";
import SessionModel from "../models/session.model.js";
import appAssert from "../utils/appAssert.js";
import { HTTP_STATUS } from "../constants/http.js";
import { verificationCodeSchema } from "./auth.schema.js";
import { clearAuthCookies } from "../utils/cookies.js";

export async function getSessionsHandler(req: Request, res: Response) {
  const sessions = await SessionModel.find({
    userId: req.userId,
    // Optional: only show sessions that haven't expired
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 }); // descending order

  appAssert(sessions, HTTP_STATUS.NOT_FOUND, "Session not found");

  // Map through sessions to add 'currentSession' only if it matches.
  const sessionList = sessions.map((session) => {
    // We use .toObject() to convert Mongoose's document a plain JS object.
    const sessionObj = session.toObject();

    return {
      ...sessionObj,
      // Only add the property if the ID matches the one in the request
      ...(sessionObj._id.toString() === req.sessionId && {
        currentSession: true,
      }),
    };
  });

  return res.status(HTTP_STATUS.OK).json(sessionList);
}

export async function deleteSessionHandler(req: Request, res: Response) {
  const sessionId = verificationCodeSchema.parse(req.params.id);

  // Delete the session from DB (ensuring it belongs to the user)
  const deletedSession = await SessionModel.findOneAndDelete({
    _id: sessionId,
    userId: req.userId,
  });
  // Handle if session didn't exist or wasn't theirs
  appAssert(deletedSession, HTTP_STATUS.NOT_FOUND, "Session not found");

  // If they deleted their CURRENT session, clear their browser cookies
  if (sessionId === req.sessionId) {
    return clearAuthCookies(res).status(HTTP_STATUS.OK).json({
      message: "Current session ended and cookies cleared.",
    });
  }

  // Otherwise, just confirm the remote device was logged out
  return res.status(HTTP_STATUS.OK).json({
    message: "Device logged out successfully.",
  });
}
