// 🎯 Points System Seed Script
// Initialize the points system with default configuration

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPointsSystem() {
  try {
    console.log('🎯 Initializing Points System...');

    // Check if configuration already exists
    const existingConfig = await prisma.pointsConfig.findFirst({
      where: { isActive: true }
    });

    if (existingConfig) {
      console.log('✅ Points configuration already exists');
      return;
    }

    // Create default points configuration
    const config = await prisma.pointsConfig.create({
      data: {
        pointsPerRand: 1.0, // 1 point per R1 spent
        minimumSpend: 5000, // R50 minimum
        membershipMultipliers: {
          BASIC: 1.0,    // 100 points for R100 spent
          PREMIUM: 1.5,  // 150 points for R100 spent  
          ELITE: 2.0     // 200 points for R100 spent
        },
        pointValue: 0.01, // 100 points = R1
        minimumRedemption: 100, // Minimum 100 points to redeem
        maxRedemptionPercent: 50.0, // Max 50% of transaction can be points
        pointsValidityDays: 365, // Points expire after 1 year
        expirationWarningDays: 30, // Warn 30 days before expiry
        extensionPurchaseMin: 2000, // Min R20 purchase extends validity
        extensionDays: 365, // Extend by 1 year
        isActive: true
      }
    });

    console.log('✅ Created default points configuration:', config.id);

    // Count existing users (no data modification)
    const usersCount = await prisma.user.count();
    console.log(`✅ Points system ready for ${usersCount} existing users (no user data modified)`);

    console.log('🎉 Points system initialization complete!');
    console.log('\n📋 Configuration Summary:');
    console.log(`• Earning Rate: 1 point per R1 spent (minimum R50)`);
    console.log(`• Membership Multipliers: Basic 1x, Premium 1.5x, Elite 2x`);
    console.log(`• Redemption Rate: 100 points = R1 discount`);
    console.log(`• Maximum Redemption: 50% of transaction`);
    console.log(`• Points Validity: 365 days`);
    console.log(`• Expiration Warnings: 30 days before expiry`);

  } catch (error) {
    console.error('❌ Error seeding points system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedPointsSystem()
    .then(() => {
      console.log('✅ Points system seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Points system seed failed:', error);
      process.exit(1);
    });
}

export default seedPointsSystem;