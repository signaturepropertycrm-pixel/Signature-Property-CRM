
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
import { Users, Award, ShieldX } from 'lucide-react';
import { Buyer, Property } from '@/lib/types';
import { format, subDays, subMonths, parseISO, eachDayOfInterval, eachMonthOfInterval, startOfMonth } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

type TimeRange = '7d' | '30d' | '6m' | '12m' | 'all';

export const BuyerBreakdownChart = ({ buyers, properties }: { buyers: Buyer[], properties: Property[] }) => {
   const [timeRange, setTimeRange] = useState<TimeRange>('all');

   const chartData = useMemo(() => {
    let interval;
    let startDate: Date | null = null;
    const now = new Date();

    switch (timeRange) {
        case '7d':
            startDate = subDays(now, 6);
            interval = eachDayOfInterval({ start: startDate, end: now });
            break;
        case '30d':
            startDate = subDays(now, 29);
            interval = eachDayOfInterval({ start: startDate, end: now });
            break;
        case '6m':
            startDate = subMonths(now, 5);
            interval = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });
            break;
        case '12m':
            startDate = subMonths(now, 11);
            interval = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });
            break;
        case 'all':
        default:
            const allBuyerDates = buyers
                .map(b => b.deal_lost_date)
                .filter(Boolean);
            const allPropertyDates = properties
                .map(p => p.sale_date)
                .filter(Boolean);
            const allDates = [...allBuyerDates, ...allPropertyDates].map(d => parseISO(d!));
            
            if (allDates.length === 0) return [];
            
            const firstDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
            interval = eachMonthOfInterval({ start: startOfMonth(firstDate), end: now });
            break;
    }
    
    const dateFormat = (timeRange === '7d' || timeRange === '30d') ? 'd MMM' : "MMM '’'yy";
    let dataMap: { [key: string]: { dealsWon: number, dealsLost: number } } = {};
    
    interval.forEach(date => {
        const key = format(date, dateFormat);
        dataMap[key] = { dealsWon: 0, dealsLost: 0 };
    });

    const closedDealsPropertyIds = new Set(properties.filter(p => p.status === 'Sold').map(p => p.id));
    
    buyers.forEach(buyer => {
        if (buyer.status === 'Deal Closed') {
            const closingProperty = properties.find(p => p.buyerId === buyer.id && p.status === 'Sold');
            const dateStr = closingProperty?.sale_date;
            if (dateStr) {
                 const date = parseISO(dateStr);
                if (!startDate || date >= startDate) {
                    const key = format(date, dateFormat);
                    if (key in dataMap) dataMap[key].dealsWon += 1;
                }
            }
        } else if (buyer.status === 'Deal Lost' && buyer.deal_lost_date) {
            const date = parseISO(buyer.deal_lost_date);
            if (!startDate || date >= startDate) {
                const key = format(date, dateFormat);
                if (key in dataMap) dataMap[key].dealsLost += 1;
            }
        }
    });
    
    return Object.keys(dataMap).map(key => ({
        date: key,
        ...dataMap[key]
    }));
    
  }, [buyers, properties, timeRange]);


  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
                <Users />
                Buyer Deals
              </CardTitle>
              <CardDescription>Deals won by your agency vs. deals lost to others.</CardDescription>
            </div>
             <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <TabsList>
                    <TabsTrigger value="7d">7D</TabsTrigger>
                    <TabsTrigger value="30d">30D</TabsTrigger>
                    <TabsTrigger value="6m">6M</TabsTrigger>
                    <TabsTrigger value="12m">12M</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
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
             <Bar dataKey="dealsWon" name="Deals Won" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
             <Bar dataKey="dealsLost" name="Deals Lost" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
