import AppErrorCode from "../constants/appErrorCode.js";
import { HttpStatusCode } from "../constants/http.js";

class AppError extends Error {
  public readonly httpStatusCode: HttpStatusCode;
  public readonly appErrorCode: AppErrorCode | undefined;

  constructor(
    message: string,
    httpStatusCode: HttpStatusCode,
    appErrorCode?: AppErrorCode
  ) {
    super(message);
    this.httpStatusCode = httpStatusCode;
    this.appErrorCode = appErrorCode;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
