import "server-only";

export class AdminAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}
