
'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { jsPDF as jsPDFType } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Tenant, EnrichedPayment, Property, OverviewStats } from './types';

// Extend the jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const addHeader = (doc: jsPDFType, title: string) => {
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text('PropBot', 14, 22);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Generated: ${format(new Date(), 'PPP')}`, doc.internal.pageSize.width - 14, 22, { align: 'right' });
};

const addFooter = (doc: jsPDFType, pageCount: number) => {
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
};

const autoSizeColumns = (worksheet: XLSX.WorkSheet, data: any[]) => {
    if (!data.length) return;
    const header = Object.keys(data[0]);
    const colWidths = header.map(key => ({
        wch: Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
        ) + 2
    }));
    worksheet['!cols'] = colWidths;
}

const createStyledExcelSheet = (data: any[], title: string, sheetName: string) => {
    const workbook = XLSX.utils.book_new();

    // Create a new worksheet with headers
    const header = [title];
    const generatedDate = [`Report Generated: ${format(new Date(), 'PPP')}`];
    
    const ws_data = [
        header,
        generatedDate,
        [], // Empty row for spacing
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Append JSON data starting from the 4th row
    XLSX.utils.sheet_add_json(worksheet, data, {
        origin: 'A4',
        skipHeader: false,
    });

    autoSizeColumns(worksheet, data);
    
    // Style the title
    if(worksheet['A1']) {
        worksheet['A1'].s = {
            font: {
                bold: true,
                sz: 16,
            }
        };
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
}


export const generateTenantListPDF = (tenants: Tenant[]) => {
  const doc = new jsPDF();
  addHeader(doc, "Tenant List");

  const tableColumn = ["Name", "Property", "Unit", "Phone", "Email", "Rent Status"];
  const tableRows: (string | number)[][] = [];

  tenants.forEach(tenant => {
    const tenantData = [
      tenant.name,
      tenant.property,
      tenant.unit,
      tenant.phone,
      tenant.email,
      tenant.rentStatus,
    ];
    tableRows.push(tenantData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    headStyles: { fillColor: [3, 105, 161] }, // HSL 205 90% 55% -> RGB
    theme: 'striped',
  });

  const pageCount = doc.internal.getNumberOfPages();
  addFooter(doc, pageCount);
  
  doc.save(`PropBot_Tenant_List_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateTenantListExcel = (tenants: Tenant[]) => {
  const data = tenants.map(t => ({
      Name: t.name,
      Property: t.property,
      Unit: t.unit,
      Phone: t.phone,
      Email: t.email,
      'Rent Status': t.rentStatus,
      'Rent Amount': t.rentAmount,
      'Lease Start': t.leaseStartDate,
      'Lease End': t.leaseEndDate,
    }));
    
  const workbook = createStyledExcelSheet(data, 'PropBot Tenant List', 'Tenants');
  XLSX.writeFile(workbook, `PropBot_Tenant_List_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const generatePaymentHistoryPDF = (payments: EnrichedPayment[]) => {
    const doc = new jsPDF();
    addHeader(doc, "Payment History");

    const tableColumn = ["Date", "Tenant", "Property", "Unit", "Amount (ZMW)", "Method"];
    const tableRows: (string | number)[][] = [];

    let total = 0;
    payments.forEach(p => {
        const paymentData = [
            format(new Date(p.date), 'PPP'),
            p.tenantName,
            p.property,
            p.unit,
            p.amount.toLocaleString(),
            p.method,
        ];
        tableRows.push(paymentData);
        total += p.amount;
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        headStyles: { fillColor: [3, 105, 161] },
        theme: 'striped',
        didDrawPage: (data) => {
            // Add total only on the last page
            if (data.pageNumber === doc.internal.getNumberOfPages()) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(
                    `Total Collected: ZMW ${total.toLocaleString()}`,
                    14,
                    data.cursor!.y + 15
                );
            }
        }
    });

    const pageCount = doc.internal.getNumberOfPages();
    addFooter(doc, pageCount);
    doc.save(`PropBot_Payment_History_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};


export const generatePaymentHistoryExcel = (payments: EnrichedPayment[]) => {
    const data = payments.map(p => ({
            'Date': format(new Date(p.date), 'yyyy-MM-dd'),
            'Tenant Name': p.tenantName,
            'Property': p.property,
            'Unit': p.unit,
            'Amount': p.amount,
            'Method': p.method,
        }));
        
    const workbook = createStyledExcelSheet(data, 'PropBot Payment History', 'Payment History');
    XLSX.writeFile(workbook, `PropBot_Payment_History_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

type SummaryReportData = {
    tenants: Tenant[];
    properties: Property[];
    payments: EnrichedPayment[];
    overview: OverviewStats;
}

export const generateSummaryReportExcel = (reportData: SummaryReportData) => {
    const { tenants, properties, payments } = reportData;
    const workbook = XLSX.utils.book_new();

    // 1. Rent Status Summary
    const rentStatusData = [
        { Status: 'Paid', Count: tenants.filter(t => t.rentStatus === 'Paid').length },
        { Status: 'Pending', Count: tenants.filter(t => t.rentStatus === 'Pending').length },
        { Status: 'Overdue', Count: tenants.filter(t => t.rentStatus === 'Overdue').length },
    ];
    const rentStatusSheet = XLSX.utils.json_to_sheet(rentStatusData);
    autoSizeColumns(rentStatusSheet, rentStatusData);
    XLSX.utils.book_append_sheet(workbook, rentStatusSheet, 'Rent Status');

    // 2. Occupancy Summary
    const occupancyData = properties.map(property => {
      const occupied = tenants.filter(t => t.property === property.name).length;
      return {
        'Property Name': property.name,
        'Total Units': property.units,
        'Occupied Units': occupied,
        'Vacant Units': property.units - occupied,
        'Occupancy Rate (%)': property.units > 0 ? ((occupied / property.units) * 100).toFixed(1) : 0,
      };
    });
    const occupancySheet = XLSX.utils.json_to_sheet(occupancyData);
    autoSizeColumns(occupancySheet, occupancyData);
    XLSX.utils.book_append_sheet(workbook, occupancySheet, 'Occupancy');

    // 3. Payment Method Summary
    const methodCounts = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentMethodData = Object.entries(methodCounts).map(([name, value]) => ({ 'Payment Method': name, 'Number of Transactions': value }));
    const paymentMethodSheet = XLSX.utils.json_to_sheet(paymentMethodData);
    autoSizeColumns(paymentMethodSheet, paymentMethodData);
    XLSX.utils.book_append_sheet(workbook, paymentMethodSheet, 'Payment Methods');

    XLSX.writeFile(workbook, `PropBot_Summary_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const generateSummaryReportPDF = (reportData: SummaryReportData) => {
    const { overview } = reportData;
    const doc = new jsPDF();
    addHeader(doc, "Executive Summary Report");
  
    // KPIs Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Key Performance Indicators", 14, 50);
  
    const kpiData = [
      ['Rental Income (This Period)', `ZMW ${overview.rentCollected.toLocaleString()}`],
      ['Outstanding Rent (All Time)', `ZMW ${overview.outstandingRent.toLocaleString()}`],
      ['Occupancy Rate', `${overview.occupancyRate.toFixed(1)}%`],
      ['Collection Rate', `${overview.collectionRate.toFixed(1)}%`],
      ['Total Properties', overview.totalProperties],
      ['Total Tenants', overview.totalTenants],
    ];
  
    doc.autoTable({
      body: kpiData,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: false, textColor: 20 },
      bodyStyles: { fontStyle: 'bold', cellWidth: 'wrap' },
      columnStyles: { 0: { fontStyle: 'normal' } },
      tableWidth: 'auto',
    });
  
    // You can add more tables for other summary data from your reportData here
    // For example, a table for rent status breakdown
  
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Rent Status Breakdown", 14, finalY + 15);
  
    const rentStatusData = [
      ['Paid', reportData.tenants.filter(t => t.rentStatus === 'Paid').length],
      ['Pending', reportData.tenants.filter(t => t.rentStatus === 'Pending').length],
      ['Overdue', reportData.tenants.filter(t => t.rentStatus === 'Overdue').length],
    ];
  
    doc.autoTable({
      head: [['Status', 'Number of Tenants']],
      body: rentStatusData,
      startY: finalY + 20,
      headStyles: { fillColor: [3, 105, 161] },
      theme: 'striped',
    });
  
    const pageCount = doc.internal.getNumberOfPages();
    addFooter(doc, pageCount);
    doc.save(`PropBot_Summary_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };
