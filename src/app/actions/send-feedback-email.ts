'use server';

interface UserInfo {
    email?: string | null;
    name?: string | null;
}

export async function sendFeedbackEmail(feedback: string, userInfo: UserInfo): Promise<{ success: boolean; message: string }> {
  const toEmail = 'feedback@assetaproptech.com'; // The email address to receive the feedback
  const subject = `New App Feedback from ${userInfo.name || userInfo.email || 'Anonymous User'}`;

  const emailBody = `
    A user has submitted feedback for the Assetta app.

    --------------------------------
    User Details:
    --------------------------------
    Name: ${userInfo.name || 'Not provided'}
    Email: ${userInfo.email || 'Not provided'}
    
    --------------------------------
    Feedback:
    --------------------------------
    ${feedback}
  `;

  // --- !!! Placeholder for your email sending logic !!! ---
  // In a real application, you would integrate a service like Resend, SendGrid, or Nodemailer here.
  try {
    console.log('--- SIMULATING FEEDBACK EMAIL SEND ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:', emailBody);
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('--- Feedback email simulation successful! ---');
    
    return { success: true, message: 'Thank you! Your feedback has been sent successfully.' };

  } catch (error: any) {
    console.error('Failed to send feedback email:', error);
    return { success: false, message: `Failed to send feedback: ${error.message}` };
  }
  // --- End of placeholder block ---
}
