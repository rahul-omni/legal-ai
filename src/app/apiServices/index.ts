import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Redirect to login
          break;
        case 403:
          // Show access denied
          break;
        case 404:
          // Show not found
          break;
        case 422:
          // Handle validation errors
          break;
        default:
          // Generic error
      }
      
      return Promise.reject(data.error || 'Something went wrong');
    }
    return Promise.reject('Network error');
  }
);
