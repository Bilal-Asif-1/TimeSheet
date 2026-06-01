import axios from "axios";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

export function getApiError(error: unknown, fallback = "Something went wrong.") {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
