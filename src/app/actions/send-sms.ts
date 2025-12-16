
'use server';

import AfricasTalking from 'africastalking';

// Initialize Africa's Talking
if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
  console.error("Africa's Talking credentials are not set in the environment variables.");
}

const africastalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY!,
  username: process.env.AFRICASTALKING_USERNAME!,
});

const sms = africastalking.SMS;

export async function sendSms(to: string | string[], message: string, localMessageId?: string): Promise<{ success: boolean; message: string; response?: any }> {
  if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
    return { success: false, message: "Africa's Talking credentials are not configured on the server." };
  }

  // A Sender ID is required for messages to be delivered in production.
  if (process.env.AFRICASTALKING_USERNAME !== 'sandbox' && !process.env.AFRICASTALKING_SENDER_ID) {
    return { success: false, message: "Africa's Talking Sender ID is not configured for the live environment." };
  }

  try {
    const response = await sms.send({
      to,
      message,
      // It can be a shortcode or an alphanumeric ID that you have registered with Africa's Talking.
      from: process.env.AFRICASTALKING_SENDER_ID,
    });
    console.log('SMS sent successfully:', response);
    return { success: true, message: 'SMS sent successfully!', response };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { success: false, message: `Failed to send SMS: ${error.toString()}` };
  }
}
