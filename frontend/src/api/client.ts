import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access"); // fixed: was "access_token"
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;