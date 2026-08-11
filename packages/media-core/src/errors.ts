export type MediaSDKErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

export class MediaSDKError extends Error {
  readonly code: MediaSDKErrorCode;
  readonly status?: number;

  constructor(code: MediaSDKErrorCode, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "MediaSDKError";
    this.code = code;
    this.status = options?.status;
  }
}
