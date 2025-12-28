
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTenants } from '@/components/tenants/tenant-provider';
import { useProperties } from '@/components/properties/property-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Home, Users, FileText, Download, ArrowLeft, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  generateTenantListPDF,
  generateTenantListExcel,
  generatePaymentHistoryPDF,
  generatePaymentHistoryExcel,
  generateSummaryReportExcel,
  generateSummaryReportPDF,
} from '@/lib/report-generator';
import { FinancialReport } from '@/components/reports/financial-report';
import { OccupancyReport } from '@/components/reports/occupancy-report';
import { TenantReportTable } from '@/components/reports/tenant-report-table';
import { useRouter } from 'next/navigation';
import { addMonths, endOfMonth, endOfYear, format, getYear, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { LeaseExpiryReport } from '@/components/reports/lease-expiry-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

function ReportsPage({ title }: { title?: string }) {
  const { tenants, isInitialized: tenantsInitialized } = useTenants();
  const { properties, isInitialized: propertiesInitialized } = useProperties();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateRange, setDateRange] = useState('this_month');
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      const element = document.getElementById(highlight);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedCard(highlight);
        const timer = setTimeout(() => {
          setHighlightedCard(null);
          // Optional: remove the query param from URL without reloading
          window.history.replaceState(null, '', window.location.pathname);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'this_year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'last_3_months':
        return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
      default: // this_month
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [dateRange]);

  const reportData = useMemo(() => {
    if (!tenantsInitialized || !propertiesInitialized) return null;

    const filteredPayments = tenants
        .flatMap(t => t.paymentHistory || [])
        .filter(p => new Date(p.date) >= startDate && new Date(p.date) <= endDate);

    const rentCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const activeTenantsInPeriod = tenants.filter(t => 
        new Date(t.leaseStartDate) <= endDate && new Date(t.leaseEndDate) >= startDate
    );
    
    // For outstanding rent, we should probably consider the current state regardless of date range.
    const outstandingRent = tenants
        .filter(t => t.rentStatus === 'Pending' || t.rentStatus === 'Overdue')
        .reduce((sum, t) => sum + t.rentAmount, 0);

    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
    const occupiedUnits = tenants.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    
    const collectionRate = rentCollected > 0 ? (rentCollected / (rentCollected + outstandingRent)) * 100 : 0;


    return {
      tenants,
      properties,
      allPayments: tenants.flatMap(t => 
        (t.paymentHistory || []).map(p => ({
          ...p,
          tenantName: t.name,
          property: t.property,
          unit: t.unit,
        }))
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      overview: {
        rentCollected,
        outstandingRent,
        occupancyRate,
        collectionRate: collectionRate > 100 ? 100 : collectionRate, // Cap at 100%
        totalTenants: tenants.length,
        totalProperties: properties.length
      },
    };
  }, [tenants, properties, tenantsInitialized, propertiesInitialized, startDate, endDate]);

  if (!reportData) {
    return <div>Loading reports...</div>;
  }

  const handleDownload = (type: 'tenantList' | 'paymentHistory' | 'summary', format: 'pdf' | 'excel') => {
    if (type === 'tenantList') {
      if (format === 'pdf') generateTenantListPDF(reportData.tenants);
      else generateTenantListExcel(reportData.tenants);
    } else if (type === 'paymentHistory') {
      if (format === 'pdf') generatePaymentHistoryPDF(reportData.allPayments);
      else generatePaymentHistoryExcel(reportData.allPayments);
    } else if (type === 'summary') {
        const summaryData = {
            tenants: reportData.tenants,
            properties: reportData.properties,
            payments: reportData.allPayments,
            overview: reportData.overview,
        };
        if (format === 'excel') {
            generateSummaryReportExcel(summaryData);
        } else {
            generateSummaryReportPDF(summaryData);
        }
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            In-depth insights into your property performance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                    <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
            </Select>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Summary Report</DropdownMenuLabel>
                 <DropdownMenuItem onClick={() => handleDownload('summary', 'pdf')}>
                    Download Summary (PDF)
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleDownload('summary', 'excel')}>
                    Download Summary (Excel)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tenant Reports</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleDownload('tenantList', 'pdf')}>
                Download Tenant List (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('tenantList', 'excel')}>
                Download Tenant List (Excel)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Financial Reports</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleDownload('paymentHistory', 'pdf')}>
                Download Payment History (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('paymentHistory', 'excel')}>
                Download Payment History (Excel)
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card id="rental-income" className={cn('transition-all', highlightedCard === 'rental-income' && 'ring-2 ring-primary ring-offset-2')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rental Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {reportData.overview.rentCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">in selected period</p>
          </CardContent>
        </Card>
        <Card id="outstanding-rent" className={cn('transition-all', highlightedCard === 'outstanding-rent' && 'ring-2 ring-primary ring-offset-2')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Rent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {reportData.overview.outstandingRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">across all properties</p>
          </CardContent>
        </Card>
        <Card id="occupancy" className={cn('transition-all', highlightedCard === 'occupancy' && 'ring-2 ring-primary ring-offset-2')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">across all properties</p>
          </CardContent>
        </Card>
        <Card id="collection-rate" className={cn('transition-all', highlightedCard === 'collection-rate' && 'ring-2 ring-primary ring-offset-2')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.overview.collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">based on current arrears</p>
          </CardContent>
        </Card>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialReport payments={reportData.allPayments} tenants={reportData.tenants} />
          <LeaseExpiryReport tenants={reportData.tenants} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
            <OccupancyReport properties={reportData.properties} tenants={reportData.tenants} />
        </div>

        <div className="grid grid-cols-1 gap-6">
            <TenantReportTable tenants={reportData.tenants} />
        </div>
    </div>
  );
}

ReportsPage.title = "Reports & Analytics";
export default ReportsPage;
