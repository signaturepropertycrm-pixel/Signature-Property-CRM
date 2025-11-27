
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { Property } from '@/lib/types';
import { useTheme } from 'next-themes';

const demoData = [
  { year: '2020', revenue: 15 },
  { year: '2021', revenue: 25 },
  { year: '2022', revenue: -10 },
  { year: '2023', revenue: 40 },
  { year: '2024', revenue: 30 },
];


export const PerformanceChart = ({ properties }: { properties: Property[] }) => {
   const { theme } = useTheme();

   const chartData = React.useMemo(() => {
    const soldProperties = properties.filter((p) => p.status === 'Sold' && p.sale_date && p.sold_price);
    
    const realDataExists = soldProperties.length > 0;

    if (!realDataExists) {
        return demoData;
    }

    const salesByYear: { [year: string]: number } = {};

    soldProperties.forEach((p) => {
        const year = new Date(p.sale_date!).getFullYear().toString();
        if (!salesByYear[year]) {
          salesByYear[year] = 0;
        }
        salesByYear[year] += p.sold_price!;
      });

    const years = Object.keys(salesByYear).sort();
    let previousYearRevenue = 0;

    const realData = years.map((year) => {
      const revenue = salesByYear[year];
      const revenuePercentage =
        previousYearRevenue === 0
          ? 0
          : ((revenue - previousYearRevenue) / previousYearRevenue) * 100;
      
      previousYearRevenue = revenue;

      return {
        year: year,
        revenue: parseFloat(revenuePercentage.toFixed(2)),
      };
    }).slice(-5); // take last 5 years

    return realData.length > 0 ? realData : demoData;
    
  }, [properties]);


  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
                <TrendingUp />
                Performance Chart
              </CardTitle>
              <CardDescription>A visual representation of year-over-year revenue growth.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#2563eb' : 'hsl(var(--primary))'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#2563eb' : 'hsl(var(--primary))'} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    return (
                        <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-2">{`Year: ${label}`}</p>
                            <p className={payload[0].value && payload[0].value > 0 ? "text-green-500" : "text-red-500"}>
                                {`Revenue Growth: ${payload[0].value}%`}
                            </p>
                        </div>
                    );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
             <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
