import assert from "node:assert";
import { HttpStatusCode } from "../constants/http.js";
import AppErrorCode from "../constants/appErrorCode.js";
import AppError from "./AppError.js";

type AppAssert = (
  condition: any,
  httpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

const appAssert: AppAssert = (
  condition,
  httpStatusCode,
  message,
  appErrorCode
) => {
  return assert(condition, new AppError(message, httpStatusCode, appErrorCode));
};

export default appAssert;
