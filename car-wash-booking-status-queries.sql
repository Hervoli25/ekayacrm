-- Car Wash Booking Status Analysis Queries
-- Use these queries to manually inspect booking status distribution and identify issues

-- 1. Basic status distribution
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM "Booking"
GROUP BY status
ORDER BY count DESC;

-- 2. Bookings by date category
SELECT 
    CASE 
        WHEN "bookingDate" < CURRENT_DATE THEN 'past'
        WHEN "bookingDate" = CURRENT_DATE THEN 'today'
        WHEN "bookingDate" > CURRENT_DATE THEN 'future'
    END as date_category,
    status,
    COUNT(*) as count
FROM "Booking"
GROUP BY 
    CASE 
        WHEN "bookingDate" < CURRENT_DATE THEN 'past'
        WHEN "bookingDate" = CURRENT_DATE THEN 'today'
        WHEN "bookingDate" > CURRENT_DATE THEN 'future'
    END,
    status
ORDER BY date_category, status;

-- 3. Problem bookings (past date with CONFIRMED/IN_PROGRESS status)
SELECT 
    b.id,
    b."bookingDate",
    b."timeSlot",
    b.status,
    b."createdAt",
    b."updatedAt",
    u."firstName",
    u."lastName",
    u.email,
    s.name as service_name,
    CURRENT_DATE - DATE(b."bookingDate") as days_overdue
FROM "Booking" b
JOIN "User" u ON b."userId" = u.id
JOIN "Service" s ON b."serviceId" = s.id
WHERE b."bookingDate" < CURRENT_DATE 
    AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
ORDER BY b."bookingDate" DESC;

-- 4. Yesterday's bookings analysis
SELECT 
    b.id,
    b."bookingDate",
    b."timeSlot",
    b.status,
    u."firstName",
    u."lastName",
    s.name as service_name,
    p.status as payment_status
FROM "Booking" b
JOIN "User" u ON b."userId" = u.id
JOIN "Service" s ON b."serviceId" = s.id
LEFT JOIN "Payment" p ON p."bookingId" = b.id
WHERE DATE(b."bookingDate") = CURRENT_DATE - INTERVAL '1 day'
ORDER BY b."timeSlot";

-- 5. Recent booking trends (last 7 days)
SELECT 
    DATE(b."bookingDate") as booking_date,
    b.status,
    COUNT(*) as count
FROM "Booking" b
WHERE b."bookingDate" >= CURRENT_DATE - INTERVAL '7 days'
    AND b."bookingDate" <= CURRENT_DATE + INTERVAL '7 days'
GROUP BY DATE(b."bookingDate"), b.status
ORDER BY booking_date DESC, b.status;

-- 6. Status transition analysis with problem counts
SELECT 
    status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN "bookingDate" < CURRENT_DATE THEN 1 END) as past_date_count,
    COUNT(CASE WHEN "bookingDate" < CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as very_old_count,
    CASE 
        WHEN status IN ('CONFIRMED', 'IN_PROGRESS') AND 
             COUNT(CASE WHEN "bookingDate" < CURRENT_DATE THEN 1 END) > 0 
        THEN 'YES' 
        ELSE 'NO' 
    END as needs_attention
FROM "Booking"
GROUP BY status
ORDER BY total_count DESC;

-- 7. Detailed customer information for problem bookings
SELECT 
    b.id,
    b."bookingDate",
    b."timeSlot",
    b.status,
    u."firstName" || ' ' || u."lastName" as customer_name,
    u.email,
    u.phone,
    v."licensePlate",
    v.make || ' ' || v.model as vehicle,
    s.name as service_name,
    s.price as service_price,
    b."totalAmount",
    p.status as payment_status,
    CURRENT_DATE - DATE(b."bookingDate") as days_overdue
FROM "Booking" b
JOIN "User" u ON b."userId" = u.id
JOIN "Vehicle" v ON b."vehicleId" = v.id
JOIN "Service" s ON b."serviceId" = s.id
LEFT JOIN "Payment" p ON p."bookingId" = b.id
WHERE b."bookingDate" < CURRENT_DATE 
    AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
ORDER BY b."bookingDate" DESC;

-- 8. Quick fix query (RUN WITH CAUTION!)
-- This will update all old CONFIRMED/IN_PROGRESS bookings to COMPLETED
/*
UPDATE "Booking"
SET status = 'COMPLETED', "updatedAt" = NOW()
WHERE "bookingDate" < CURRENT_DATE
    AND status IN ('CONFIRMED', 'IN_PROGRESS')
RETURNING id, "bookingDate", status;
*/

-- 9. Summary statistics
SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN "bookingDate" >= CURRENT_DATE THEN 1 END) as future_bookings,
    COUNT(CASE WHEN "bookingDate" < CURRENT_DATE THEN 1 END) as past_bookings,
    COUNT(CASE WHEN "bookingDate" < CURRENT_DATE AND status IN ('CONFIRMED', 'IN_PROGRESS') THEN 1 END) as problematic_bookings,
    COUNT(CASE WHEN DATE("bookingDate") = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as yesterday_bookings
FROM "Booking";

-- 10. Valid status values check
SELECT DISTINCT status FROM "Booking" ORDER BY status;

-- Expected status values should be:
-- CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW