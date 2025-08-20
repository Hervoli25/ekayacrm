/**
 * Environment variable utilities with validation
 * Ensures required environment variables are present and provides fallbacks where appropriate
 */

export const env = {
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // CRM Configuration  
  CAR_WASH_DB_URL: process.env.CAR_WASH_DB_URL || '',
  CAR_WASH_API_KEY: process.env.CAR_WASH_API_KEY || '',

  // NextAuth Configuration
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',

  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

/**
 * Validates that required environment variables are present
 * @param requiredVars Array of environment variable names that are required
 * @throws Error if any required variables are missing
 */
export function validateRequiredEnvVars(requiredVars: (keyof typeof env)[]): void {
  const missing = requiredVars.filter(varName => !env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Gets CRM API key with validation
 * @throws Error if CAR_WASH_API_KEY is not configured
 */
export function getCRMApiKey(): string {
  const apiKey = env.CAR_WASH_API_KEY;
  if (!apiKey) {
    throw new Error('CAR_WASH_API_KEY environment variable is required for CRM operations');
  }
  return apiKey;
}

/**
 * Gets CRM database URL with validation
 * @throws Error if CAR_WASH_DB_URL is not configured
 */
export function getCRMDatabaseUrl(): string {
  const dbUrl = env.CAR_WASH_DB_URL;
  if (!dbUrl) {
    throw new Error('CAR_WASH_DB_URL environment variable is required for CRM database operations');
  }
  return dbUrl;
}