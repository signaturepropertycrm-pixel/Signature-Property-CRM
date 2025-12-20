
'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { Property } from '@/lib/types';
import { useTheme } from 'next-themes';
import { parseISO, subDays } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

type TimeRange = '7d' | '30d' | 'all';

export const PropertyTypesChart = ({ properties }: { properties: Property[] }) => {
   const { theme } = useTheme();
   const [timeRange, setTimeRange] = useState<TimeRange>('30d');

   const chartData = useMemo(() => {
    let filteredProperties = properties;
    const now = new Date();

    if (timeRange !== 'all') {
        const daysToSubtract = timeRange === '7d' ? 7 : 30;
        const startDate = subDays(now, daysToSubtract);
        filteredProperties = properties.filter(p => p.created_at && parseISO(p.created_at) >= startDate);
    }
    
    const typeCounts: { [key: string]: number } = {};
    filteredProperties.forEach(p => {
        const type = p.property_type || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.keys(typeCounts)
        .map(type => ({ type, count: typeCounts[type] }))
        .sort((a,b) => b.count - a.count);
    
  }, [properties, timeRange]);

  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
                <Home />
                Property Types
              </CardTitle>
              <CardDescription>Breakdown of property types in your inventory.</CardDescription>
            </div>
             <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <TabsList>
                    <TabsTrigger value="7d">7D</TabsTrigger>
                    <TabsTrigger value="30d">30D</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis 
                type="category" 
                dataKey="type" 
                width={100}
                tickLine={false} 
                axisLine={false} 
                fontSize={12}
             />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    return (
                        <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-2">{label}</p>
                            <p style={{ color: payload[0].fill }}>
                                {`Count: ${payload[0].value}`}
                            </p>
                        </div>
                    );
                }
                return null;
              }}
            />
            <Bar dataKey="count" name="Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
