// 🎯 Points System Service
// Complete business logic for car wash loyalty points system

import { Client } from 'pg';
import { getCarWashConfig } from './config';
import { PointTransactionType } from '@prisma/client';

export interface PointsConfig {
  pointsPerRand: number;
  minimumSpend: number;
  membershipMultipliers: {
    BASIC: number;
    PREMIUM: number;
    ELITE: number;
  };
  pointValue: number;
  minimumRedemption: number;
  maxRedemptionPercent: number;
  pointsValidityDays: number;
  expirationWarningDays: number;
  extensionPurchaseMin: number;
  extensionDays: number;
}

export class PointsService {
  
  // Get current points configuration
  static async getConfig(): Promise<PointsConfig> {
    const config = await prisma.pointsConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      // Create default config if none exists
      return await this.createDefaultConfig();
    }

    return {
      pointsPerRand: config.pointsPerRand,
      minimumSpend: config.minimumSpend,
      membershipMultipliers: config.membershipMultipliers as any,
      pointValue: config.pointValue,
      minimumRedemption: config.minimumRedemption,
      maxRedemptionPercent: config.maxRedemptionPercent,
      pointsValidityDays: config.pointsValidityDays,
      expirationWarningDays: config.expirationWarningDays,
      extensionPurchaseMin: config.extensionPurchaseMin,
      extensionDays: config.extensionDays,
    };
  }

  // Create default configuration
  static async createDefaultConfig(): Promise<PointsConfig> {
    const defaultConfig = {
      pointsPerRand: 1.0,
      minimumSpend: 5000, // R50
      membershipMultipliers: {
        BASIC: 1.0,
        PREMIUM: 1.5,
        ELITE: 2.0
      },
      pointValue: 0.01, // 100 points = R1
      minimumRedemption: 100,
      maxRedemptionPercent: 50.0,
      pointsValidityDays: 365,
      expirationWarningDays: 30,
      extensionPurchaseMin: 2000, // R20
      extensionDays: 365
    };

    await prisma.pointsConfig.create({
      data: {
        pointsPerRand: defaultConfig.pointsPerRand,
        minimumSpend: defaultConfig.minimumSpend,
        membershipMultipliers: defaultConfig.membershipMultipliers,
        pointValue: defaultConfig.pointValue,
        minimumRedemption: defaultConfig.minimumRedemption,
        maxRedemptionPercent: defaultConfig.maxRedemptionPercent,
        pointsValidityDays: defaultConfig.pointsValidityDays,
        expirationWarningDays: defaultConfig.expirationWarningDays,
        extensionPurchaseMin: defaultConfig.extensionPurchaseMin,
        extensionDays: defaultConfig.extensionDays,
      }
    });

    return defaultConfig;
  }

  // Award points when booking is completed
  static async awardPoints(
    userId: string, 
    bookingId: string | null, 
    amount: number, 
    membershipPlan = 'BASIC'
  ): Promise<number> {
    const config = await this.getConfig();
    
    // Check minimum spend requirement
    if (amount < config.minimumSpend) {
      return 0;
    }

    // Calculate points with membership multiplier
    const basePoints = Math.floor(amount * config.pointsPerRand);
    const multiplier = config.membershipMultipliers[membershipPlan as keyof typeof config.membershipMultipliers] || 1.0;
    const pointsEarned = Math.floor(basePoints * multiplier);

    // Set expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.pointsValidityDays);

    try {
      // Create transaction and update user balance in a single transaction
      await prisma.$transaction(async (tx) => {
        // Create points transaction
        await tx.pointTransaction.create({
          data: {
            userId,
            bookingId,
            type: PointTransactionType.EARNED_BOOKING,
            points: pointsEarned,
            description: `Earned from ${amount/100}R service (${membershipPlan} member)`,
            serviceAmount: amount,
            multiplier,
            expiresAt,
          }
        });

        // Update user's total points balance
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              increment: pointsEarned
            }
          }
        });

        // Create expiration tracking
        await tx.pointsExpiration.create({
          data: {
            userId,
            pointsAmount: pointsEarned,
            expiryDate: expiresAt,
          }
        });
      });

      return pointsEarned;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw new Error('Failed to award points');
    }
  }

  // Redeem points during checkout
  static async redeemPoints(
    userId: string, 
    pointsToUse: number, 
    bookingAmount: number,
    bookingId?: string
  ): Promise<{ success: boolean; discountAmount: number; message: string }> {
    const config = await this.getConfig();
    
    // Get user's current points balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });

    if (!user) {
      return { success: false, discountAmount: 0, message: 'User not found' };
    }

    // Validate redemption
    if (pointsToUse < config.minimumRedemption) {
      return { 
        success: false, 
        discountAmount: 0, 
        message: `Minimum ${config.minimumRedemption} points required for redemption` 
      };
    }

    if (pointsToUse > user.loyaltyPoints) {
      return { 
        success: false, 
        discountAmount: 0, 
        message: 'Insufficient points balance' 
      };
    }

    // Check maximum redemption percentage
    const maxRedeemableAmount = Math.floor(bookingAmount * (config.maxRedemptionPercent / 100));
    const requestedDiscountAmount = Math.floor(pointsToUse * config.pointValue * 100); // Convert to cents

    if (requestedDiscountAmount > maxRedeemableAmount) {
      const maxUsablePoints = Math.floor(maxRedeemableAmount / (config.pointValue * 100));
      return { 
        success: false, 
        discountAmount: 0, 
        message: `Can only use maximum ${maxUsablePoints} points (50% of total)` 
      };
    }

    const finalDiscountAmount = requestedDiscountAmount;

    try {
      await prisma.$transaction(async (tx) => {
        // Create redemption transaction
        await tx.pointTransaction.create({
          data: {
            userId,
            bookingId,
            type: PointTransactionType.REDEEMED_BOOKING,
            points: -pointsToUse,
            description: `Redeemed for R${(finalDiscountAmount/100).toFixed(2)} discount`,
            discountAmount: finalDiscountAmount,
            redeemedAgainst: `Booking discount`,
          }
        });

        // Update user's points balance
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              decrement: pointsToUse
            }
          }
        });

        // Create redemption record
        await tx.pointsRedemption.create({
          data: {
            userId,
            bookingId,
            pointsUsed: pointsToUse,
            discountAmount: finalDiscountAmount,
            originalAmount: bookingAmount,
            finalAmount: bookingAmount - finalDiscountAmount,
          }
        });
      });

      return { 
        success: true, 
        discountAmount: finalDiscountAmount, 
        message: `Successfully redeemed ${pointsToUse} points for R${(finalDiscountAmount/100).toFixed(2)} discount` 
      };
    } catch (error) {
      console.error('Error redeeming points:', error);
      return { success: false, discountAmount: 0, message: 'Failed to redeem points' };
    }
  }

  // Get user's points balance and summary
  static async getPointsBalance(userId: string): Promise<{
    currentBalance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    lifetimeExpired: number;
    expiringBalance: number;
    recentTransactions: any[];
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });

    const transactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const lifetimeEarned = await prisma.pointTransaction.aggregate({
      where: { 
        userId, 
        points: { gt: 0 } 
      },
      _sum: { points: true }
    });

    const lifetimeRedeemed = await prisma.pointTransaction.aggregate({
      where: { 
        userId, 
        points: { lt: 0 } 
      },
      _sum: { points: true }
    });

    const expiredPoints = await prisma.pointTransaction.aggregate({
      where: { 
        userId, 
        type: PointTransactionType.EXPIRED 
      },
      _sum: { points: true }
    });

    // Points expiring in next 30 days
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 30);
    
    const expiringPoints = await prisma.pointsExpiration.aggregate({
      where: {
        userId,
        expiryDate: { lte: expiringDate },
        isProcessed: false
      },
      _sum: { pointsAmount: true }
    });

    return {
      currentBalance: user?.loyaltyPoints || 0,
      lifetimeEarned: lifetimeEarned._sum.points || 0,
      lifetimeRedeemed: Math.abs(lifetimeRedeemed._sum.points || 0),
      lifetimeExpired: Math.abs(expiredPoints._sum.points || 0),
      expiringBalance: expiringPoints._sum.pointsAmount || 0,
      recentTransactions: transactions.map(t => ({
        id: t.id,
        date: t.createdAt,
        type: t.type,
        points: t.points,
        description: t.description,
        expires: t.expiresAt
      }))
    };
  }

  // Admin function to manually award points
  static async awardManualPoints(
    userId: string, 
    amount: number, 
    reason: string, 
    adminUserId: string
  ): Promise<boolean> {
    const config = await this.getConfig();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.pointsValidityDays);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointTransactionType.EARNED_BONUS,
            points: amount,
            description: `Admin bonus: ${reason}`,
            adminNote: reason,
            adminUserId,
            isManual: true,
            expiresAt,
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              increment: amount
            }
          }
        });

        await tx.pointsExpiration.create({
          data: {
            userId,
            pointsAmount: amount,
            expiryDate: expiresAt,
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Error awarding manual points:', error);
      return false;
    }
  }

  // Admin function to deduct points
  static async deductPoints(
    userId: string, 
    amount: number, 
    reason: string, 
    adminUserId: string
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointTransactionType.ADJUSTED_ADMIN,
            points: -amount,
            description: `Admin adjustment: ${reason}`,
            adminNote: reason,
            adminUserId,
            isManual: true,
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              decrement: amount
            }
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Error deducting points:', error);
      return false;
    }
  }

  // Process expired points (to be run as cron job)
  static async processExpiredPoints(): Promise<number> {
    const expiredPoints = await prisma.pointsExpiration.findMany({
      where: {
        expiryDate: { lt: new Date() },
        isProcessed: false
      },
      include: { user: true }
    });

    let totalExpired = 0;

    for (const expiry of expiredPoints) {
      try {
        await prisma.$transaction(async (tx) => {
          // Create expiration transaction
          await tx.pointTransaction.create({
            data: {
              userId: expiry.userId,
              type: PointTransactionType.EXPIRED,
              points: -expiry.pointsAmount,
              description: `Points expired after ${expiry.expiryDate.toDateString()}`,
            }
          });

          // Update user balance
          await tx.user.update({
            where: { id: expiry.userId },
            data: {
              loyaltyPoints: {
                decrement: expiry.pointsAmount
              }
            }
          });

          // Mark expiration as processed
          await tx.pointsExpiration.update({
            where: { id: expiry.id },
            data: {
              isProcessed: true,
              processedAt: new Date()
            }
          });
        });

        totalExpired += expiry.pointsAmount;
      } catch (error) {
        console.error(`Error processing expiration for user ${expiry.userId}:`, error);
      }
    }

    return totalExpired;
  }

  // Get points analytics for business reporting
  static async getPointsAnalytics() {
    const totalPointsOutstanding = await prisma.user.aggregate({
      _sum: { loyaltyPoints: true }
    });

    const totalEarned = await prisma.pointTransaction.aggregate({
      where: { points: { gt: 0 } },
      _sum: { points: true }
    });

    const totalRedeemed = await prisma.pointTransaction.aggregate({
      where: { points: { lt: 0 } },
      _sum: { points: true }
    });

    const activeUsers = await prisma.user.count({
      where: { loyaltyPoints: { gt: 0 } }
    });

    const config = await this.getConfig();
    const pointsLiability = (totalPointsOutstanding._sum.loyaltyPoints || 0) * config.pointValue * 100;

    return {
      totalPointsOutstanding: totalPointsOutstanding._sum.loyaltyPoints || 0,
      totalLifetimeEarned: totalEarned._sum.points || 0,
      totalLifetimeRedeemed: Math.abs(totalRedeemed._sum.points || 0),
      activePointsUsers: activeUsers,
      pointsLiabilityInCents: Math.round(pointsLiability),
      averagePointsPerUser: activeUsers > 0 ? Math.round((totalPointsOutstanding._sum.loyaltyPoints || 0) / activeUsers) : 0
    };
  }
}