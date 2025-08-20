const fs = require('fs');
const path = require('path');

// List of files that need to be fixed
const filesToFix = [
  'app/app/api/crm/analytics/route.ts',
  'app/app/api/crm/bookings/diagnostic/route.ts',
  'app/app/api/crm/bookings/search/route.ts',
  'app/app/api/crm/bookings/[id]/status/route.ts',
  'app/app/api/crm/capacity/today/route.ts',
  'app/app/api/crm/customers/add/route.ts',
  'app/app/api/crm/customers/message/route.ts',
  'app/app/api/crm/promotions/route.ts',
  'app/app/api/crm/promotions/send/route.ts',
  'app/app/api/crm/users/route.ts',
];

// Security fix patterns
const oldImportPattern = `import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';
const CAR_WASH_DB_URL = 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';`;

const newImportPattern = `import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';`;

const oldConnectionPattern = `const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });`;

const newConnectionPattern = `// Get secure configuration
    const { databaseUrl } = getCarWashConfig();
    
    const client = new Client({
      connectionString: databaseUrl,
    });`;

const oldAuthPattern = `// Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }`;

const newAuthPattern = `// Verify API key securely
    const apiKey = request.headers.get('X-API-Key');
    if (!validateCarWashApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }`;

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix imports and constants
    if (content.includes(oldImportPattern)) {
      content = content.replace(oldImportPattern, newImportPattern);
      modified = true;
    }

    // Fix database connection
    if (content.includes('connectionString: CAR_WASH_DB_URL')) {
      content = content.replace(oldConnectionPattern, newConnectionPattern);
      modified = true;
    }

    // Fix API key validation
    if (content.includes('apiKey !== API_KEY')) {
      content = content.replace(oldAuthPattern, newAuthPattern);
      modified = true;
    }

    // Additional patterns for different file structures
    if (content.includes('const API_KEY = \'ekhaya-car-wash-secret-key-2024\';')) {
      content = content.replace(/const API_KEY = 'ekhaya-car-wash-secret-key-2024';/g, '');
      modified = true;
    }

    if (content.includes('const CAR_WASH_DB_URL = \'postgresql://')) {
      content = content.replace(/const CAR_WASH_DB_URL = 'postgresql:\/\/[^']+';/g, '');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix the diagnostic script
function fixDiagnosticScript() {
  const scriptPath = 'app/scripts/booking-status-diagnostic.ts';
  try {
    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️  Script not found: ${scriptPath}`);
      return;
    }

    let content = fs.readFileSync(scriptPath, 'utf8');
    
    // Replace hardcoded fallback with environment variable only
    const oldPattern = `const CAR_WASH_DB_URL = process.env.CAR_WASH_DB_URL || 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';`;
    const newPattern = `const CAR_WASH_DB_URL = process.env.CAR_WASH_DATABASE_URL;

if (!CAR_WASH_DB_URL) {
  console.error('❌ CAR_WASH_DATABASE_URL environment variable is required');
  process.exit(1);
}`;

    if (content.includes(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      fs.writeFileSync(scriptPath, content);
      console.log(`✅ Fixed diagnostic script: ${scriptPath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing diagnostic script:`, error.message);
  }
}

// Main execution
console.log('🔒 Starting security vulnerability fixes...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

// Fix diagnostic script
fixDiagnosticScript();

console.log(`\n🎉 Security fix complete!`);
console.log(`📊 Fixed ${fixedCount} out of ${filesToFix.length} files`);
console.log(`\n⚠️  IMPORTANT NEXT STEPS:`);
console.log(`1. Copy app/.env.example to app/.env`);
console.log(`2. Fill in your actual secure values in app/.env`);
console.log(`3. Never commit .env files to version control`);
console.log(`4. Rotate your database credentials immediately`);
console.log(`5. Generate new API keys for production`);
