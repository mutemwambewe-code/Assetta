
'use client';

import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useTenants } from '../tenants/tenant-provider';
import { parseISO, startOfMonth } from 'date-fns';

// Helper to get past 6 months
const getPastSixMonths = () => {
  const months = [];
  const date = new Date();
  date.setDate(1);
  for (let i = 0; i < 6; i++) {
    months.unshift(new Date(date));
    date.setMonth(date.getMonth() - 1);
  }
  return months;
};


const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 text-sm shadow-lg">
          <p className="font-bold">{label}</p>
          <p style={{ color: 'hsl(var(--chart-2))' }}>
            Collected: ZMW {payload[1].value.toLocaleString()}
          </p>
          <p style={{ color: 'hsl(var(--chart-1))' }}>
            Outstanding: ZMW {payload[0].value.toLocaleString()}
          </p>
        </Card>
      );
    }
  
    return null;
  };

export function RentStatusChart() {
  const router = useRouter();
  const { tenants } = useTenants();

  // Aggregate rent data
  const aggregateRentData = () => {
    const months = getPastSixMonths();
    const allPayments = tenants.flatMap(t => t.paymentHistory.map(p => ({...p, tenantId: t.id, rentAmount: t.rentAmount})));
    
    return months.map(month => {
      const monthKey = month.toLocaleString('default', { month: 'short' });
      const currentMonthStart = startOfMonth(month);

      const paymentsInMonth = allPayments.filter(p => {
        const paymentDate = parseISO(p.date);
        return paymentDate.getMonth() === month.getMonth() && paymentDate.getFullYear() === month.getFullYear();
      });
      
      const collectedForMonth = paymentsInMonth.reduce((sum, p) => sum + p.amount, 0);

      // Get total due from tenants active in this month
      const totalDueInMonth = tenants
        .filter(t => {
            const leaseStart = parseISO(t.leaseStartDate);
            const leaseEnd = parseISO(t.leaseEndDate);
            return leaseStart < new Date(month.getFullYear(), month.getMonth() + 1, 1) && leaseEnd >= month;
        })
        .reduce((sum, t) => sum + t.rentAmount, 0);
        
      const outstandingForMonth = totalDueInMonth - collectedForMonth;

      return {
        month: monthKey,
        outstanding: outstandingForMonth > 0 ? outstandingForMonth : 0,
        collected: collectedForMonth,
      };
    });
  };

  const rentData = aggregateRentData();

  const handleChartClick = () => {
    router.push('/reports');
  };
  
  return (
    <Card className="shadow-none h-full cursor-pointer hover:border-primary/50 transition-colors" onClick={handleChartClick}>
      <CardHeader>
        <CardTitle>Rent Collection Trend</CardTitle>
        <CardDescription>A comparison of rent collected versus the outstanding rent for each month.</CardDescription>
      </CardHeader>
      <CardContent className='h-[300px]'>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rentData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `ZMW ${value / 1000}k`}
            />
             <Tooltip cursor={{ fill: 'hsla(var(--card-foreground) / 0.1)' }} content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "0.8rem"}}/>
            <Bar dataKey="outstanding" fill="hsl(var(--chart-1))" name="Outstanding Rent" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" fill="hsl(var(--chart-2))" name="Rent Collected" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
