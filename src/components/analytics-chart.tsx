
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Buyer } from '@/lib/types';
import { TrendingUp, Flame, Star, PhoneForwarded } from 'lucide-react';
import { useMemo } from 'react';

const COLORS = ['#f59e0b', '#ef4444', '#8b5cf6'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const AnalyticsChart = ({ buyers }: { buyers: Buyer[] }) => {
  const data = useMemo(() => {
    const interested = buyers.filter(b => b.status === 'Interested').length;
    const hotLeads = buyers.filter(b => b.status === 'Hot Lead').length;
    const followUp = buyers.filter(b => b.status === 'Follow Up').length;

    const chartData = [
        { name: 'Interested', value: interested, icon: Star },
        { name: 'Hot Leads', value: hotLeads, icon: Flame },
        { name: 'Follow-up', value: followUp, icon: PhoneForwarded },
    ];
    
    // If all values are zero, show some demo data
    if (chartData.every(d => d.value === 0)) {
        return [
            { name: 'Interested', value: 12, icon: Star },
            { name: 'Hot Leads', value: 5, icon: Flame },
            { name: 'Follow-up', value: 8, icon: PhoneForwarded },
        ];
    }
    
    return chartData;

  }, [buyers]);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
          <TrendingUp />
          Analytics
        </CardTitle>
        <CardDescription>A quick overview of lead statuses.</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              className="focus:outline-none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                      <p className="font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
                iconSize={10}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ bottom: 10 }}
                formatter={(value, entry) => {
                    const { color } = entry;
                    const item = data.find(d => d.name === value);
                    const Icon = item?.icon;
                    return (
                        <span style={{ color }} className="flex items-center gap-1 text-sm font-medium">
                            {Icon && <Icon className="h-4 w-4" />}
                            {value} ({item?.value})
                        </span>
                    )
                }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
