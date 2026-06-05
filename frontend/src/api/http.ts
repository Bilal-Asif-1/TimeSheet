import axios from "axios";
import { getApiBaseUrl } from "../config/env";

// Puri frontend isi shared Axios client se backend ko requests bhejti hai.
export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Har request se pehle saved JWT token Authorization header mein lagaya jata hai.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("appToken");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
