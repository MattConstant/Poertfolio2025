// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3600';
  }
  
  // For production (Vercel), use your home server's public IP or domain
  // Defaults to your email service host if env var is not provided
  return process.env.NEXT_PUBLIC_API_URL || 'http://174.115.167.119:8080';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  PORTFOLIO_CONTACT: `${API_BASE_URL}/api/portfolio/contact`,
  BUSINESS_CONTACT: `${API_BASE_URL}/api/send-email`,
} as const; 