/**
 * Secure Configuration Management
 * 
 * This file centralizes all environment variable access and provides
 * type-safe configuration management for the application.
 */

// Server-side configuration (only available in API routes and server components)
export const serverConfig = {
  // Car Wash CRM Database Configuration
  carWash: {
    apiKey: process.env.CAR_WASH_API_KEY,
    databaseUrl: process.env.CAR_WASH_DATABASE_URL,
  },
  
  // Main HR Database Configuration
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // Authentication Configuration
  auth: {
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  },
  
  // Email Configuration (if used)
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
  },
  
  // Application Configuration
  app: {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || '3000',
  },
};

// Client-side configuration (safe to expose to browser)
export const clientConfig = {
  app: {
    name: 'Ekhaya Intel Trading HR System',
    version: '1.0.0',
    nodeEnv: process.env.NODE_ENV,
  },
};

// Configuration validation function
export function validateServerConfig() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'CAR_WASH_API_KEY',
    'CAR_WASH_DATABASE_URL',
  ];
  
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}

// Helper function to get car wash database configuration
export function getCarWashConfig() {
  if (!serverConfig.carWash.apiKey || !serverConfig.carWash.databaseUrl) {
    throw new Error(
      'Car wash configuration is missing. Please set CAR_WASH_API_KEY and CAR_WASH_DATABASE_URL environment variables.'
    );
  }
  
  return {
    apiKey: serverConfig.carWash.apiKey,
    databaseUrl: serverConfig.carWash.databaseUrl,
  };
}

// Helper function to validate API key
export function validateCarWashApiKey(providedKey: string | null): boolean {
  if (!providedKey || !serverConfig.carWash.apiKey) {
    return false;
  }
  
  return providedKey === serverConfig.carWash.apiKey;
}
