import axios from "axios";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

// Axios, JavaScript aur unknown errors ko ek simple message mein convert karta hai.
export function getApiError(error: unknown, fallback = "Something went wrong.") {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
