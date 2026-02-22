
import jsPDF from 'jspdf';
import { Lease, Property, Tenant, UserProfile } from '@/lib/types';
import { format } from 'date-fns';

/**
 * Generates a Residential Tenancy Agreement PDF adapted for Zambia context.
 */
export const generateLeasePdf = (lease: Lease, tenant: Tenant, property: Property, landlord: UserProfile) => {
    const doc = new jsPDF();
    const lineHeight = 10;
    let y = 20;

    // -- Header --
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RESIDENTIAL LEASE AGREEMENT', 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('This Agreement is made on this day: ' + format(new Date(), 'PPP'), 20, y);
    y += 15;

    // -- Parties --
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BETWEEN (LANDLORD):', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`${landlord.name || 'Landlord Name'}`, 20, y);
    // doc.text(`Contact: ${landlord.email}`, 20, y + 5);
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.text('AND (TENANT):', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`${tenant.name}`, 20, y);
    doc.text(`Phone: ${tenant.phone}`, 20, y + 5);
    doc.text(`NRC/ID: [_________________]`, 20, y + 10);
    y += 20;

    // -- Property --
    doc.setFont('helvetica', 'bold');
    doc.text('1. THE PREMISES', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`The Landlord agrees to rent to the Tenant the property located at:`, 20, y);
    y += 5;
    doc.text(`${property.location}, Unit: ${property.type}`, 20, y);
    y += 15;

    // -- Terms --
    doc.setFont('helvetica', 'bold');
    doc.text('2. TERM AND RENT', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    const duration = Math.round((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    doc.text(`The lease term is for ${duration} months, starting ${format(new Date(lease.startDate), 'PPP')} and ending ${format(new Date(lease.endDate), 'PPP')}.`, 20, y, { maxWidth: 170 });
    y += 10;
    doc.text(`Monthly Rent: ZMW ${lease.rentAmount.toLocaleString()}`, 20, y);
    y += 7;
    doc.text(`Payable in advance on the 1st day of each month.`, 20, y);
    y += 15;

    // -- Zambia Specific Clauses --
    doc.setFont('helvetica', 'bold');
    doc.text('3. UTILITIES AND MAINTENANCE', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('a) The Tenant is responsible for prepaid ZESCO units and Water bills.', 20, y);
    y += 7;
    doc.text('b) The Tenant shall maintain the premises in good clean condition.', 20, y);
    y += 7;
    doc.text('c) No structural alterations without written consent.', 20, y);
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.text('4. TAX COMPLIANCE (ZRA)', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('The Landlord acknowledges responsibility for declaring rental income to', 20, y);
    y += 5;
    doc.text('the Zambia Revenue Authority (ZRA) in accordance with Income Tax laws.', 20, y);
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.text('5. TERMINATION', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Either party may terminate this agreement with 1 months written notice.', 20, y);
    y += 20;

    // -- Signatures --
    doc.setLineWidth(0.5);
    doc.line(20, y + 20, 80, y + 20); // Landlord Line
    doc.line(110, y + 20, 170, y + 20); // Tenant Line

    doc.text('Landlord Signature', 20, y + 25);
    doc.text('Tenant Signature', 110, y + 25);

    doc.save(`Lease_${tenant.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyy')}.pdf`);
    return doc;
};
