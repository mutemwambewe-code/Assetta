'use server';

import type { Invoice } from '@/lib/types';
import { format } from 'date-fns';

// This is a placeholder for your actual email sending service.
// You can replace this with Resend, SendGrid, Nodemailer, etc.

const generateInvoiceHTML = (invoice: Invoice, tenantEmail: string) => {
  const { tenantName, propertyName, issueDate, dueDate, items, totalAmount, notes } = invoice;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; color: #333; }
        .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; }
        .header { text-align: center; margin-bottom: 20px; }
        .details { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .total { text-align: right; margin-top: 20px; font-size: 1.2em; font-weight: bold; }
        .notes { margin-top: 20px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice</h1>
          <p>From: Assetta Property Management</p>
        </div>
        <div class="details">
          <p><strong>To:</strong> ${tenantName} (${tenantEmail})</p>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Issue Date:</strong> ${format(new Date(issueDate), 'PPP')}</p>
          <p><strong>Due Date:</strong> ${format(new Date(dueDate), 'PPP')}</p>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (ZMW)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Total Due: ZMW ${totalAmount.toLocaleString()}</p>
        </div>
        ${notes ? `<div class="notes"><p><strong>Notes:</strong><br/>${notes}</p></div>` : ''}
      </div>
    </body>
    </html>
  `;
};


export async function sendInvoiceEmail(invoice: Invoice, tenantEmail: string): Promise<{ success: boolean; message: string }> {
  console.log('--- Preparing to Send Invoice Email ---');
  console.log('Tenant Email:', tenantEmail);
  
  if (!tenantEmail) {
    console.error('Invoice sending failed: Tenant email is missing.');
    return { success: false, message: 'Tenant does not have a registered email address.' };
  }

  const invoiceHtml = generateInvoiceHTML(invoice, tenantEmail);
  const subject = `Invoice from Assetta for ${invoice.propertyName}`;

  // --- !!! Placeholder for your email sending logic !!! ---
  // Replace this block with your actual email sending implementation
  // e.g., using Resend, SendGrid, Nodemailer, etc.
  try {
    console.log('--- SIMULATING EMAIL SEND ---');
    console.log(`To: ${tenantEmail}`);
    console.log(`Subject: ${subject}`);
    // You can uncomment the line below to see the full HTML in your server logs
    // console.log('Body:', invoiceHtml);
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('--- Email simulation successful! ---');
    
    return { success: true, message: 'Invoice email sent successfully (simulated).' };

  } catch (error: any) {
    console.error('Failed to send invoice email:', error);
    return { success: false, message: `Failed to send email: ${error.message}` };
  }
  // --- End of placeholder block ---
}
