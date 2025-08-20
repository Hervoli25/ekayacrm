/**
 * Car Wash Booking Status Diagnostic Script
 * 
 * This script analyzes the current booking status distribution and identifies
 * issues with bookings that should have transitioned status (e.g., old confirmed
 * bookings that should be completed).
 * 
 * Usage:
 * npm run tsx scripts/booking-status-diagnostic.ts
 * 
 * Or to fix issues automatically:
 * npm run tsx scripts/booking-status-diagnostic.ts --fix
 */

import { Client } from 'pg';

const CAR_WASH_DB_URL = process.env.CAR_WASH_DATABASE_URL;

if (!CAR_WASH_DB_URL) {
  console.error('❌ CAR_WASH_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runDiagnostic(shouldFix: boolean = false) {
  const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Running Car Wash Booking Status Diagnostic...\n');

    // 1. Get basic booking statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN "bookingDate" >= CURRENT_DATE THEN 1 END) as future_bookings,
        COUNT(CASE WHEN "bookingDate" < CURRENT_DATE THEN 1 END) as past_bookings
      FROM "Booking"
    `;

    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];

    console.log('📊 BOOKING SUMMARY');
    console.log('==================');
    console.log(`Total Bookings: ${stats.total_bookings}`);
    console.log(`Future Bookings: ${stats.future_bookings}`);
    console.log(`Past Bookings: ${stats.past_bookings}\n`);

    // 2. Status distribution
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM "Booking"
      GROUP BY status
      ORDER BY count DESC
    `;

    const statusResult = await client.query(statusQuery);

    console.log('📈 STATUS DISTRIBUTION');
    console.log('======================');
    statusResult.rows.forEach(row => {
      console.log(`${row.status.padEnd(15)} ${String(row.count).padStart(6)} bookings (${row.percentage}%)`);
    });
    console.log();

    // 3. Check for problematic bookings
    const problemBookingsQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        array_agg(DISTINCT DATE("bookingDate")::text) as sample_dates
      FROM "Booking"
      WHERE "bookingDate" < CURRENT_DATE 
        AND status IN ('CONFIRMED', 'IN_PROGRESS')
      GROUP BY status
      ORDER BY count DESC
    `;

    const problemResult = await client.query(problemBookingsQuery);

    if (problemResult.rows.length > 0) {
      console.log('⚠️  ISSUES FOUND');
      console.log('================');
      
      let totalProblematicBookings = 0;
      problemResult.rows.forEach(row => {
        totalProblematicBookings += parseInt(row.count);
        console.log(`${row.status}: ${row.count} bookings with past dates`);
        console.log(`   Sample dates: ${row.sample_dates.slice(0, 3).join(', ')}`);
        console.log();
      });

      console.log(`🚨 Total problematic bookings: ${totalProblematicBookings}\n`);

      // 4. Show specific examples
      const exampleQuery = `
        SELECT 
          b.id,
          b."bookingDate",
          b."timeSlot",
          b.status,
          u."firstName",
          u."lastName",
          s.name as service_name,
          CURRENT_DATE - DATE(b."bookingDate") as days_overdue
        FROM "Booking" b
        JOIN "User" u ON b."userId" = u.id
        JOIN "Service" s ON b."serviceId" = s.id
        WHERE b."bookingDate" < CURRENT_DATE 
          AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
        ORDER BY b."bookingDate" DESC
        LIMIT 10
      `;

      const exampleResult = await client.query(exampleQuery);

      console.log('🔍 EXAMPLE PROBLEMATIC BOOKINGS');
      console.log('===============================');
      console.log('ID'.padEnd(10) + 'Date'.padEnd(12) + 'Time'.padEnd(8) + 'Status'.padEnd(12) + 'Customer'.padEnd(25) + 'Days Overdue');
      console.log('-'.repeat(80));
      
      exampleResult.rows.forEach(row => {
        console.log(
          row.id.slice(-8).padEnd(10) +
          row.bookingDate.toISOString().split('T')[0].padEnd(12) +
          row.timeSlot.padEnd(8) +
          row.status.padEnd(12) +
          `${row.firstName} ${row.lastName}`.padEnd(25) +
          row.days_overdue
        );
      });
      console.log();

      // 5. Business logic recommendations
      console.log('💡 BUSINESS LOGIC RECOMMENDATIONS');
      console.log('==================================');
      console.log('1. Bookings should transition through these states:');
      console.log('   CONFIRMED → IN_PROGRESS → COMPLETED');
      console.log('');
      console.log('2. Alternative end states:');
      console.log('   CONFIRMED → CANCELLED (if cancelled before service)');
      console.log('   CONFIRMED → NO_SHOW (if customer doesn\'t arrive)');
      console.log('');
      console.log('3. Auto-completion logic:');
      console.log('   - CONFIRMED bookings past their date should be COMPLETED or NO_SHOW');
      console.log('   - IN_PROGRESS bookings past their date should be COMPLETED');
      console.log('');

      // 6. Fix problematic bookings if requested
      if (shouldFix) {
        console.log('🔧 FIXING PROBLEMATIC BOOKINGS');
        console.log('==============================');
        
        const fixQuery = `
          UPDATE "Booking"
          SET status = 'COMPLETED', "updatedAt" = NOW()
          WHERE "bookingDate" < CURRENT_DATE
            AND status IN ('CONFIRMED', 'IN_PROGRESS')
          RETURNING id, "bookingDate", status
        `;

        const fixResult = await client.query(fixQuery);
        
        console.log(`✅ Successfully updated ${fixResult.rows.length} bookings to COMPLETED`);
        
        if (fixResult.rows.length > 0) {
          console.log('\nUpdated bookings:');
          fixResult.rows.forEach(row => {
            console.log(`- ${row.id.slice(-8)} (${row.bookingDate.toISOString().split('T')[0]}) → ${row.status}`);
          });
        }
      } else {
        console.log('🔧 TO FIX THESE ISSUES');
        console.log('======================');
        console.log('Run this script with --fix flag:');
        console.log('npm run tsx scripts/booking-status-diagnostic.ts -- --fix');
        console.log('');
        console.log('Or use the diagnostic API endpoint:');
        console.log('POST /api/crm/bookings/diagnostic');
        console.log('{ "action": "bulk_complete_old" }');
      }
    } else {
      console.log('✅ No problematic bookings found! All booking statuses look healthy.\n');
    }

    // 7. Recent booking trends
    const trendQuery = `
      SELECT 
        DATE("bookingDate") as booking_date,
        status,
        COUNT(*) as count
      FROM "Booking"
      WHERE "bookingDate" >= CURRENT_DATE - INTERVAL '7 days'
        AND "bookingDate" <= CURRENT_DATE + INTERVAL '7 days'
      GROUP BY DATE("bookingDate"), status
      ORDER BY booking_date DESC, status
    `;

    const trendResult = await client.query(trendQuery);

    if (trendResult.rows.length > 0) {
      console.log('📅 RECENT BOOKING TRENDS (Last 7 days + Next 7 days)');
      console.log('====================================================');
      console.log('Date'.padEnd(12) + 'Status'.padEnd(15) + 'Count');
      console.log('-'.repeat(35));
      
      trendResult.rows.forEach(row => {
        const isToday = row.booking_date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
        const dateStr = row.booking_date.toISOString().split('T')[0];
        const displayDate = isToday ? `${dateStr} (TODAY)` : dateStr;
        
        console.log(
          displayDate.padEnd(20) +
          row.status.padEnd(15) +
          row.count
        );
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ Error running diagnostic:', error);
  } finally {
    await client.end();
    console.log('🏁 Diagnostic completed.');
  }
}

// Check for --fix argument
const shouldFix = process.argv.includes('--fix');

runDiagnostic(shouldFix).catch(console.error);