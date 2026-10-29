// Every failure the API can report has a stable `code`.
// The client maps codes to messages and actions (retry, edit input, ...).
export const ERROR_CODES = {
  INVALID_INPUT: 400,
  NOT_FOOD: 422,
  RATE_LIMITED: 429,
  CONFIG: 500,
  BAD_OUTPUT: 502,
  UPSTREAM: 502,
  TIMEOUT: 504,
};

export class AppError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.status = ERROR_CODES[code] ?? 500;
    this.details = details;
  }
}

export function errorBody(err) {
  return { error: { code: err.code, message: err.message } };
}
