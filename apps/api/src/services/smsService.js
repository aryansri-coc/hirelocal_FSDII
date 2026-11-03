/**
 * SMS Notification Service
 * Sends automated SMS messages to workers and customers using Fast2SMS / Indian SMS Gateway.
 */

import { db } from '../../../../database/db.js';

/**
 * Sends an SMS message to an Indian phone number via Fast2SMS
 * @param {Object} options
 * @param {string} options.toPhone - 10-digit Indian phone number
 * @param {string} options.message - The SMS message text (supports Hindi unicode)
 * @param {string} [options.title] - Notification title for in-app logs
 * @returns {Promise<Object>} Delivery result
 */
export async function sendJobSmsNotification({ toPhone, message, title = 'Job Update' }) {
  if (!toPhone) return { success: false, message: 'No phone number provided' };

  const cleanPhone = String(toPhone).replace(/\D/g, '').slice(-10);
  const apiKey = process.env.FAST2SMS_API_KEY;

  console.log(`[SMS Gateway] Preparing SMS to ${cleanPhone}: "${message.slice(0, 60)}..."`);

  // Record into database notifications log
  db.addNotification({
    userId: `phone_${cleanPhone}`,
    title,
    message,
    type: 'sms_dispatch',
    entityType: 'sms',
    entityId: `sms_${Date.now()}`
  });

  if (!apiKey || apiKey.includes('your_')) {
    console.log('[SMS Gateway] FAST2SMS_API_KEY not configured. SMS recorded locally.');
    return { success: true, localOnly: true };
  }

  try {
    const payload = {
      route: 'q',
      message,
      language: 'unicode',
      flash: 0,
      numbers: cleanPhone
    };

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && (data.return === true || data.status_code === 200)) {
      console.log(`[SMS Gateway] SMS delivered successfully to ${cleanPhone}! Request ID: ${data.request_id || data.message?.[0]}`);
      return { success: true, requestId: data.request_id };
    } else {
      console.warn(`[SMS Gateway] Fast2SMS notice: ${data.message || JSON.stringify(data)}`);
      return { success: false, notice: data.message };
    }
  } catch (err) {
    console.error('[SMS Gateway] Network error dispatching SMS:', err.message);
    return { success: false, error: err.message };
  }
}

