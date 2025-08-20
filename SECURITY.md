# Security Configuration Guide

This document outlines the security measures implemented to protect sensitive credentials and API keys.

## ⚠️ Security Vulnerabilities Fixed

The following security issues have been resolved:

1. **Hardcoded API Keys** - Moved to environment variables
2. **Database Connection Strings** - Secured with environment variables  
3. **Default Admin Credentials** - Secured in documentation

## 🔐 Environment Variables Setup

### Required Server-Side Variables

Create a `.env` file in the `/app` directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# CRM Integration (Server-side)
CAR_WASH_DB_URL="postgresql://username:password@host:port/database?sslmode=require"
CAR_WASH_API_KEY="your-secure-api-key-here"

# CRM Integration (Client-side)
NEXT_PUBLIC_CAR_WASH_API_KEY="your-secure-api-key-here"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
```

### Environment Variable Security

- **Server-side variables**: `CAR_WASH_API_KEY`, `CAR_WASH_DB_URL` - Only accessible on the server
- **Client-side variables**: `NEXT_PUBLIC_CAR_WASH_API_KEY` - Exposed to the browser (use with caution)

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different API keys for different environments (dev, staging, prod)
- Regularly rotate API keys and database passwords
- Use strong, randomly generated secrets

### 2. Database Security
- Use connection pooling and SSL connections
- Implement least-privilege access for database users
- Regularly audit database access logs

### 3. API Security
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Validate all API requests and sanitize inputs
- Log and monitor API usage

### 4. Admin Account Security
- Change default admin credentials immediately after setup
- Use strong, unique passwords for all admin accounts
- Enable two-factor authentication
- Regularly audit admin account activity

## 📁 Files Modified

The following files were updated to remove hardcoded credentials:

### API Routes
- `/app/api/crm/bookings/[id]/status/route.ts`
- `/app/api/crm/bookings/[id]/route.ts`
- `/app/api/crm/bookings/search/route.ts`
- `/app/api/crm/customers/route.ts`
- `/app/api/crm/capacity/today/route.ts`
- `/app/api/crm/dashboard/stats/route.ts`
- `/app/api/crm/analytics/route.ts`

### Client Components
- `/hooks/use-crm-data.ts`
- `/components/crm/booking-management.tsx`
- `/components/crm/analytics-dashboard.tsx`
- `/components/crm/customer-tools.tsx`

### Configuration Files
- `/lib/env.ts` - Server-side environment utilities
- `/lib/crm-config.ts` - Client-side configuration
- `.env.example` - Environment variable template

### Documentation
- `README.md` - Removed hardcoded admin credentials

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables in your hosting platform
- [ ] Generate secure API keys and database passwords
- [ ] Change default admin credentials
- [ ] Enable SSL/TLS for all connections
- [ ] Configure rate limiting and monitoring
- [ ] Test API endpoints with new credentials
- [ ] Audit logs and access patterns

## 🔍 Monitoring & Alerts

Implement monitoring for:
- Failed authentication attempts
- Unusual API usage patterns
- Database connection errors
- Environment variable loading issues

## 📞 Security Incident Response

If you suspect a security breach:
1. Immediately rotate all API keys and passwords
2. Review access logs for suspicious activity
3. Update environment variables in all environments
4. Monitor for unauthorized access attempts
5. Document the incident and lessons learned