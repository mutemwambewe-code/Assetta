
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRouter } from 'next/navigation';
import { useTenants } from '../tenants/tenant-provider';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 text-sm shadow-lg">
          <p className="font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </Card>
      );
    }
  
    return null;
  };

export default function TenantActivity() {
  const router = useRouter();
  const { tenants } = useTenants();

  const statusData = [
    { name: 'Paid', value: tenants.filter(t => t.rentStatus === 'Paid').length },
    { name: 'Pending', value: tenants.filter(t => t.rentStatus === 'Pending').length },
    { name: 'Overdue', value: tenants.filter(t => t.rentStatus === 'Overdue').length },
  ];

  const totalTenants = tenants.length;
  
  const handlePieClick = (data: any) => {
    const status = data.name;
    if (status) {
      router.push(`/tenants?filter=${status}`);
    }
  };

  return (
    <Card className="shadow-none h-full">
      <CardHeader>
        <CardTitle>Rent Payment Status</CardTitle>
        <CardDescription>
          Distribution of tenants by current rent status.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handlePieClick}
                    className='cursor-pointer'
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value, percent, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 25;
                        const x  = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy  + radius * Math.sin(-midAngle * RADIAN);
            
                        return (
                          <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className='text-xs font-semibold'>
                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                >
                    {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={'hsl(var(--card))'} strokeWidth={2} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}}/>
            </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
