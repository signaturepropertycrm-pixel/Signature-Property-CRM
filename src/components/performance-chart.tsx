
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
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Home, Building } from 'lucide-react';
import { Property } from '@/lib/types';
import { useTheme } from 'next-themes';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency } from '@/lib/formatters';

// This function initializes the data structure for the last 12 months with zero revenue.
const initializeMonthlyData = () => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        data.push({
            month: format(date, "MMM '’'yy"),
            salesRevenue: 0,
            rentRevenue: 0,
        });
    }
    return data;
};

export const PerformanceChart = ({ properties }: { properties: Property[] }) => {
   const { theme } = useTheme();
   const { currency } = useCurrency();

   const chartData = React.useMemo(() => {
    const saleProperties = properties.filter((p) => p.status === 'Sold' && p.sale_date && p.total_commission);
    const rentProperties = properties.filter((p) => p.status === 'Rent Out' && p.rent_out_date && p.rent_total_commission);

    const monthlyDataMap: { [key: string]: { salesRevenue: number, rentRevenue: number } } = {};
    const now = new Date();

    // Initialize map for the last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, "MMM '’'yy");
        monthlyDataMap[monthKey] = { salesRevenue: 0, rentRevenue: 0 };
    }
    
    saleProperties.forEach((p) => {
        const saleDate = parseISO(p.sale_date!);
        const monthKey = format(saleDate, "MMM '’'yy");
        if (monthKey in monthlyDataMap) {
            monthlyDataMap[monthKey].salesRevenue += p.total_commission!;
        }
    });

    rentProperties.forEach((p) => {
        const rentDate = parseISO(p.rent_out_date!);
        const monthKey = format(rentDate, "MMM '’'yy");
        if (monthKey in monthlyDataMap) {
            monthlyDataMap[monthKey].rentRevenue += p.rent_total_commission!;
        }
    });
    
    // If there's no data at all, return an initialized array with zeros to show an empty chart
    if (saleProperties.length === 0 && rentProperties.length === 0) {
        return initializeMonthlyData();
    }


    return Object.keys(monthlyDataMap).map(month => ({
        month,
        salesRevenue: monthlyDataMap[month].salesRevenue,
        rentRevenue: monthlyDataMap[month].rentRevenue,
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
              <CardDescription>Revenue from sales and rentals over the last 12 months.</CardDescription>
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
              bottom: 20,
            }}
          >
            <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#2563eb' : 'hsl(var(--primary))'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#2563eb' : 'hsl(var(--primary))'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#16a34a' : '#22c55e'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#16a34a' : '#22c55e'} stopOpacity={0}/>
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
                            {payload.map(pld => (
                                <p key={pld.dataKey} style={{ color: pld.color }}>
                                    {`${pld.name}: ${formatCurrency(pld.value as number, currency)}`}
                                </p>
                            ))}
                        </div>
                    );
                }
                return null;
              }}
            />
             <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: 20}} />
             <Area 
                type="monotone"
                dataKey="salesRevenue"
                name="Sales Revenue"
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))' }}
            />
            <Area 
                type="monotone"
                dataKey="rentRevenue"
                name="Rent Revenue"
                stroke="#22c55e"
                fillOpacity={1} 
                fill="url(#colorRent)" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#22c55e', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--background))', stroke: '#22c55e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
