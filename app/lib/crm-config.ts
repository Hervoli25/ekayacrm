/**
 * Client-side configuration for CRM integration
 * This file contains configuration that is safe to expose to the client
 */

// Note: Client-side environment variables in Next.js must be prefixed with NEXT_PUBLIC_
export const crmConfig = {
  // CRM API configuration - this should be set via environment variable
  // NEXT_PUBLIC_CAR_WASH_API_KEY should be set in your deployment environment
  apiKey: process.env.NEXT_PUBLIC_CAR_WASH_API_KEY || 'development-api-key',
  
  // API endpoints
  endpoints: {
    bookings: '/api/crm/bookings',
    customers: '/api/crm/customers', 
    analytics: '/api/crm/analytics',
    capacity: '/api/crm/capacity',
    dashboard: '/api/crm/dashboard',
  }
} as const;

/**
 * Gets CRM API headers for client-side requests
 */
export function getCRMApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': crmConfig.apiKey,
  };
}

/**
 * Validates CRM configuration
 * @throws Error if required configuration is missing
 */
export function validateCRMConfig(): void {
  if (!crmConfig.apiKey || crmConfig.apiKey === 'development-api-key') {
    console.warn('⚠️  CRM API key not configured. Set NEXT_PUBLIC_CAR_WASH_API_KEY environment variable.');
  }
}