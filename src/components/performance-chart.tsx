
'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Property } from '@/lib/types';
import { useTheme } from 'next-themes';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency } from '@/lib/formatters';

// Generate demo data for the last 12 months
const generateDemoData = () => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        data.push({
            month: format(date, "MMM '’'yy"),
            revenue: Math.floor(Math.random() * (500000 - 50000 + 1)) + 50000,
        });
    }
    return data;
};

export const PerformanceChart = ({ properties }: { properties: Property[] }) => {
   const { theme } = useTheme();
   const { currency } = useCurrency();

   const chartData = React.useMemo(() => {
    const soldProperties = properties.filter((p) => p.status === 'Sold' && p.sale_date && p.total_commission);
    
    if (soldProperties.length === 0) {
        return generateDemoData();
    }

    const monthlyRevenue: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, "MMM '’'yy");
        monthlyRevenue[monthKey] = 0;
    }
    
    soldProperties.forEach((p) => {
        const saleDate = parseISO(p.sale_date!);
        const monthKey = format(saleDate, "MMM '’'yy");
        if (monthKey in monthlyRevenue) {
            monthlyRevenue[monthKey] += p.total_commission!;
        }
    });

    return Object.keys(monthlyRevenue).map(month => ({
        month,
        revenue: monthlyRevenue[month],
    }));
    
  }, [properties]);


  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
                <TrendingUp />
                Monthly Revenue
              </CardTitle>
              <CardDescription>Revenue from commission over the last 12 months.</CardDescription>
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
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => formatCurrency(value as number, currency, { notation: 'compact' })}
              tickLine={false}
              axisLine={false}
              width={80}
              fontSize={12}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    return (
                        <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-2">{label}</p>
                            <p className="text-primary">
                                {`Revenue: ${formatCurrency(payload[0].value as number, currency)}`}
                            </p>
                        </div>
                    );
                }
                return null;
              }}
            />
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
