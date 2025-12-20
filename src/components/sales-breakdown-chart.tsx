
'use client';

import React, { useState } from 'react';
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
import { TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';
import { Property } from '@/lib/types';
import { useTheme } from 'next-themes';
import { format, subDays, subMonths, parseISO, eachDayOfInterval, eachMonthOfInterval, startOfMonth } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

type TimeRange = '7d' | '30d' | '6m' | '12m';

export const SalesBreakdownChart = ({ properties }: { properties: Property[] }) => {
   const { theme } = useTheme();
   const [timeRange, setTimeRange] = useState<TimeRange>('12m');

   const chartData = React.useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let dataMap: { [key: string]: { agencySales: number, externalSales: number } } = {};
    let dateFormat: string;
    let interval;

    switch (timeRange) {
        case '7d':
            startDate = subDays(now, 6);
            dateFormat = 'EEE';
            interval = eachDayOfInterval({ start: startDate, end: now });
            break;
        case '30d':
            startDate = subDays(now, 29);
            dateFormat = 'd MMM';
            interval = eachDayOfInterval({ start: startDate, end: now });
            break;
        case '6m':
            startDate = subMonths(now, 5);
            dateFormat = "MMM '’'yy";
            interval = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });
            break;
        case '12m':
        default:
            startDate = subMonths(now, 11);
            dateFormat = "MMM '’'yy";
            interval = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });
            break;
    }
    
    interval.forEach(date => {
        const key = format(date, dateFormat);
        dataMap[key] = { agencySales: 0, externalSales: 0 };
    });

    properties.forEach((p) => {
        if (p.status === 'Sold' && p.sale_date) {
            const saleDate = parseISO(p.sale_date);
            if (saleDate >= startDate) {
                const key = format(saleDate, dateFormat);
                if (key in dataMap) dataMap[key].agencySales += 1;
            }
        } else if (p.status === 'Sold (External)' && p.sold_externally_date) {
            const externalSaleDate = parseISO(p.sold_externally_date);
             if (externalSaleDate >= startDate) {
                const key = format(externalSaleDate, dateFormat);
                if (key in dataMap) dataMap[key].externalSales += 1;
            }
        }
    });
    
    return Object.keys(dataMap).map(key => ({
        date: key,
        agencySales: dataMap[key].agencySales,
        externalSales: dataMap[key].externalSales,
    }));
    
  }, [properties, timeRange]);


  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
                <TrendingUp />
                Sales Breakdown
              </CardTitle>
              <CardDescription>Agency sales vs. external sales.</CardDescription>
            </div>
             <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <TabsList>
                    <TabsTrigger value="7d">7D</TabsTrigger>
                    <TabsTrigger value="30d">30D</TabsTrigger>
                    <TabsTrigger value="6m">6M</TabsTrigger>
                    <TabsTrigger value="12m">12M</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} fontSize={12} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    return (
                        <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-2">{label}</p>
                            {payload.map(pld => (
                                <p key={pld.dataKey} style={{ color: pld.fill }}>
                                    {`${pld.name}: ${pld.value}`}
                                </p>
                            ))}
                        </div>
                    );
                }
                return null;
              }}
            />
            <Legend 
                verticalAlign="bottom" 
                wrapperStyle={{paddingTop: 20}} 
                iconType="circle"
            />
             <Bar dataKey="agencySales" name="Agency Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
             <Bar dataKey="externalSales" name="External Sales" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
