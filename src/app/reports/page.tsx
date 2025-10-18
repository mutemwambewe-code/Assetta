
'use client';

import { useMemo } from 'react';
import { useTenants } from '@/components/tenants/tenant-provider';
import { useProperties } from '@/components/properties/property-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Home, Users, FileText, Download, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/lib/report-generator';
import type { Tenant, Property, Payment } from '@/lib/types';
import { FinancialReport } from '@/components/reports/financial-report';
import { OccupancyReport } from '@/components/reports/occupancy-report';
import { TenantReportTable } from '@/components/reports/tenant-report-table';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

function ReportsPage({ title }: { title?: string }) {
  const { tenants, isInitialized: tenantsInitialized } = useTenants();
  const { properties, isInitialized: propertiesInitialized } = useProperties();
  const router = useRouter();

  const reportData = useMemo(() => {
    if (!tenantsInitialized || !propertiesInitialized) return null;

    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
    const occupiedUnits = tenants.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const totalMonthlyRent = tenants.reduce((sum, t) => sum + t.rentAmount, 0);
    const allPayments = tenants.flatMap(t => 
      (t.paymentHistory || []).map(p => ({
        ...p,
        tenantName: t.name,
        property: t.property,
        unit: t.unit,
      }))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      tenants,
      properties,
      allPayments,
      overview: {
        totalProperties: properties.length,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        totalTenants: tenants.length,
        totalMonthlyRent,
      },
    };
  }, [tenants, properties, tenantsInitialized, propertiesInitialized]);

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
    } else if (type === 'summary' && format === 'excel') {
        generateSummaryReportExcel({
            tenants: reportData.tenants,
            properties: reportData.properties,
            payments: reportData.allPayments,
        });
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
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                <Download className="mr-2" />
                Download Report
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Summary Report</DropdownMenuLabel>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.totalProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.totalUnits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.totalTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ZMW {reportData.overview.totalMonthlyRent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financials">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
        </TabsList>
        <TabsContent value="financials">
          <FinancialReport payments={reportData.allPayments} tenants={reportData.tenants} />
        </TabsContent>
        <TabsContent value="occupancy">
          <OccupancyReport properties={reportData.properties} tenants={reportData.tenants} />
        </TabsContent>
        <TabsContent value="tenants">
          <TenantReportTable tenants={reportData.tenants} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

ReportsPage.title = "Reports & Analytics";
export default ReportsPage;
