
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
import { Users, Home } from 'lucide-react';
import { Property, Buyer } from '@/lib/types';
import { useTheme } from 'next-themes';
import { format, subMonths, parseISO } from 'date-fns';

const initializeMonthlyData = () => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        data.push({
            month: format(date, "MMM '’'yy"),
            newSaleProperties: 0,
            newRentProperties: 0,
            newSaleBuyers: 0,
            newRentBuyers: 0,
        });
    }
    return data;
};

export const LeadsChart = ({ properties, buyers }: { properties: Property[], buyers: Buyer[] }) => {
   const { theme } = useTheme();

   const chartData = React.useMemo(() => {
    const monthlyDataMap: { [key: string]: { newSaleProperties: number, newRentProperties: number, newSaleBuyers: number, newRentBuyers: number } } = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, "MMM '’'yy");
        monthlyDataMap[monthKey] = { newSaleProperties: 0, newRentProperties: 0, newSaleBuyers: 0, newRentBuyers: 0 };
    }
    
    properties.forEach((p) => {
        if (!p.created_at) return;
        const createdDate = parseISO(p.created_at);
        const monthKey = format(createdDate, "MMM '’'yy");
        if (monthKey in monthlyDataMap) {
            if (p.is_for_rent) {
                monthlyDataMap[monthKey].newRentProperties += 1;
            } else {
                monthlyDataMap[monthKey].newSaleProperties += 1;
            }
        }
    });

    buyers.forEach((b) => {
        if (!b.created_at) return;
        const createdDate = parseISO(b.created_at);
        const monthKey = format(createdDate, "MMM '’'yy");
        if (monthKey in monthlyDataMap) {
            if (b.listing_type === 'For Rent') {
                monthlyDataMap[monthKey].newRentBuyers += 1;
            } else {
                 monthlyDataMap[monthKey].newSaleBuyers += 1;
            }
        }
    });

    if (properties.length === 0 && buyers.length === 0) {
        return initializeMonthlyData();
    }

    return Object.keys(monthlyDataMap).map(month => ({
        month,
        ...monthlyDataMap[month]
    }));
    
  }, [properties, buyers]);


  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
                <Users />
                Monthly Leads Growth
              </CardTitle>
              <CardDescription>New properties and buyers added over the last 12 months.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
                <linearGradient id="colorSaleProps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#3b82f6' : '#60a5fa'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#3b82f6' : '#60a5fa'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRentProps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#f97316' : '#fb923c'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#f97316' : '#fb923c'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSaleBuyers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#8b5cf6' : '#a78bfa'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#8b5cf6' : '#a78bfa'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRentBuyers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#14b8a6' : '#2dd4bf'} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#14b8a6' : '#2dd4bf'} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} fontSize={12} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    return (
                        <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-2">{label}</p>
                            {payload.map(pld => (
                                <p key={pld.dataKey} style={{ color: pld.stroke }}>
                                    {`${pld.name}: ${pld.value}`}
                                </p>
                            ))}
                        </div>
                    );
                }
                return null;
              }}
            />
             <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: 20}} />
             <Area type="monotone" dataKey="newSaleProperties" name="Sale Properties" stroke="#60a5fa" fill="url(#colorSaleProps)" strokeWidth={2} />
             <Area type="monotone" dataKey="newRentProperties" name="Rent Properties" stroke="#fb923c" fill="url(#colorRentProps)" strokeWidth={2} />
             <Area type="monotone" dataKey="newSaleBuyers" name="Sale Buyers" stroke="#a78bfa" fill="url(#colorSaleBuyers)" strokeWidth={2} />
             <Area type="monotone" dataKey="newRentBuyers" name="Rent Buyers" stroke="#2dd4bf" fill="url(#colorRentBuyers)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
