
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Property, Tenant } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

interface OccupancyReportProps {
  properties: Property[];
  tenants: Tenant[];
}

export function OccupancyReport({ properties, tenants }: OccupancyReportProps) {
  const occupancyByProperty = useMemo(() => {
    return properties.map(property => {
      const occupied = tenants.filter(t => t.property === property.name).length;
      const rate = property.units > 0 ? (occupied / property.units) * 100 : 0;
      return {
        name: property.name,
        occupied,
        vacant: property.units - occupied,
        rate,
        units: property.units,
      };
    });
  }, [properties, tenants]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy by Property</CardTitle>
            <CardDescription>Breakdown of occupied vs. vacant units per property.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyByProperty} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={150} />
                <Tooltip cursor={{ fill: 'hsla(var(--card-foreground) / 0.1)' }} />
                <Legend />
                <Bar dataKey="occupied" stackId="a" fill="hsl(var(--chart-1))" name="Occupied" />
                <Bar dataKey="vacant" stackId="a" fill="hsl(var(--chart-5))" name="Vacant" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rates</CardTitle>
            <CardDescription>Percentage of units occupied in each property.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {occupancyByProperty.map(prop => (
              <div key={prop.name} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-medium">{prop.name}</h4>
                  <span className="text-sm font-bold">{prop.rate.toFixed(1)}%</span>
                </div>
                <Progress value={prop.rate} className="h-2" />
                <p className="text-xs text-muted-foreground">{prop.occupied} / {prop.units} units occupied</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
