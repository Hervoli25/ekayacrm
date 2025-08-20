import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Get secure configuration
    const { databaseUrl } = getCarWashConfig();

    const client = new Client({
      connectionString: databaseUrl,
    });

    // Verify API key securely
    const apiKey = request.headers.get('X-API-Key');
    if (!validateCarWashApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    const { messageType, messageText, customerIds } = await request.json();

    if (!messageText || !messageType || !customerIds || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: messageType, messageText, customerIds' },
        { status: 400 }
      );
    }

    // Create notifications for each customer
    const notifications = [];
    
    for (const customerId of customerIds) {
      const notificationQuery = `
        INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", "createdAt", "updatedAt")
        VALUES (
          $1, $2, $3, $4, $5, false, NOW(), NOW()
        )
        RETURNING id
      `;
      
      const notificationId = `cmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const title = messageType === 'promotional' ? 'Special Offer!' : 
                   messageType === 'reminder' ? 'Appointment Reminder' :
                   messageType === 'followup' ? 'Follow-up Message' : 'Message from Ekhaya Car Wash';

      const result = await client.query(notificationQuery, [
        notificationId,
        customerId,
        messageType.toUpperCase(),
        title,
        messageText
      ]);

      notifications.push(result.rows[0]);
    }

    return NextResponse.json({
      message: 'Messages sent successfully',
      sentCount: notifications.length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Error sending messages:', error);
    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}