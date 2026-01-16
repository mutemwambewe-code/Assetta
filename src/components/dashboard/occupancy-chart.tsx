
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
import { useProperties } from '../properties/property-provider';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 text-sm shadow-lg">
          <p className="font-bold">{label}</p>
          <p style={{ color: 'hsl(var(--chart-1))' }}>
            Occupied: {payload[0].value}
          </p>
           <p style={{ color: 'hsl(var(--chart-5))' }}>
            Vacant: {payload[1].value}
          </p>
        </Card>
      );
    }
  
    return null;
};

const MAX_PROPERTIES_SHOWN = 4;

export function OccupancyChart() {
  const router = useRouter();
  const { tenants, isInitialized: tenantsReady } = useTenants();
  const { properties, isInitialized: propertiesReady } = useProperties();
  const [startIndex, setStartIndex] = useState(0);

  const occupancyByProperty = useMemo(() => {
    return properties.map(property => {
      const occupied = tenants.filter(t => t.property === property.name).length;
      return {
        name: property.name,
        occupied,
        vacant: property.units - occupied,
      };
    });
  }, [properties, tenants]);

  useEffect(() => {
    if (properties.length <= MAX_PROPERTIES_SHOWN) return;

    const interval = setInterval(() => {
      setStartIndex(current => (current + MAX_PROPERTIES_SHOWN) % properties.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [properties.length]);

  const displayedProperties = occupancyByProperty.slice(startIndex, startIndex + MAX_PROPERTIES_SHOWN);

  const handleChartClick = () => {
    router.push('/reports?highlight=occupancy-report');
  };

  if (!tenantsReady || !propertiesReady) {
      return <Skeleton className="h-full w-full" />
  }
  
  return (
    <Card className="shadow-none h-full cursor-pointer hover:border-primary/50 transition-colors" onClick={handleChartClick}>
      <CardHeader>
        <CardTitle>Occupancy by Property</CardTitle>
        <CardDescription>Breakdown of occupied vs. vacant units per property.</CardDescription>
      </CardHeader>
      <CardContent className='h-[300px]'>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayedProperties} layout="vertical" margin={{ left: 50 }}>
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                width={150}
                tick={{ width: 140, textOverflow: 'ellipsis' }}
            />
            <Tooltip cursor={{ fill: 'hsla(var(--card-foreground) / 0.1)' }} content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "0.8rem"}} />
            <Bar dataKey="occupied" stackId="a" fill="hsl(var(--chart-1))" name="Occupied" radius={[4, 0, 0, 4]} />
            <Bar dataKey="vacant" stackId="a" fill="hsl(var(--chart-5))" name="Vacant" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
