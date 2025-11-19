
'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Property } from '@/lib/types';

const colors = [
    '#2563eb',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
];

const demoData = [
  { year: '2020', revenue: 15, cost: -5 },
  { year: '2021', revenue: 25, cost: -8 },
  { year: '2022', revenue: -10, cost: -3 },
  { year: '2023', revenue: 40, cost: -12 },
  { year: '2024', revenue: 30, cost: -10 },
];


const CustomTick = (props: any) => {
  const { x, y, payload, index } = props;
  const radius = 12;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={0} r={radius} fill={colors[index % colors.length]} />
       <text x={0} y={radius + 15} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12px">
        {payload.value}
      </text>
    </g>
  );
};


const CustomBar = (props: any) => {
    const { x, y, width, height, value, fill } = props;
  
    if (value === 0) return null;
  
    // For negative values, the bar grows downwards.
    // Recharts provides `y` as the top of the bar and `height` as a positive value.
    // To draw downwards from the zero line, we need to know where the zero line is.
    // But since the component doesn't know about the y-axis, we make an assumption
    // or adjust based on the value. If value is negative, y is the zero-line.
    if (value < 0) {
      return <rect x={x} y={y} width={width} height={-height} fill={fill} />;
    }
    
    // For positive values, the bar grows upwards.
    // `y` is the top of the bar, `height` is its height.
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
};

export const PerformanceChart = ({ properties }: { properties: Property[] }) => {

   const chartData = React.useMemo(() => {
    if (!properties || properties.filter(p => p.status === 'Sold').length === 0) {
      return demoData;
    }

    const salesByYear: { [year: string]: number } = {};

    properties
      .filter((p) => p.status === 'Sold' && p.sold_at && p.sold_price)
      .forEach((p) => {
        const year = new Date(p.sold_at!).getFullYear().toString();
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

      // Using dummy cost data for now
      const costPercentage = -(Math.random() * 15 + 5); 

      return {
        year: year,
        revenue: parseFloat(revenuePercentage.toFixed(2)),
        cost: parseFloat(costPercentage.toFixed(2)),
      };
    }).slice(-5); // take last 5 years

    return realData.length > 0 ? realData : demoData;
    
  }, [properties]);


  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-2xl font-bold">Performance Chart</CardTitle>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <span>Cost</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
            barGap={150}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={<CustomTick />}
              tickMargin={25}
              interval={0}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'rgba(230, 230, 230, 0.3)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const revenue = payload.find(p => p.dataKey === 'revenue');
                    const cost = payload.find(p => p.dataKey === 'cost');

                    return (
                        <div className="bg-background/80 backdrop-blur-sm border p-3 rounded-lg shadow-lg">
                            <p className="font-bold text-lg mb-2">{`Year: ${revenue?.payload.year}`}</p>
                            {revenue && <p className="text-green-500">{`Revenue Growth: ${revenue.value}%`}</p>}
                            {cost && <p className="text-red-500">{`Cost: ${-cost.value}%`}</p>}
                        </div>
                    );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#a1a1aa" strokeWidth={2} />
            <Bar dataKey="revenue">
               {chartData.map((entry, index) => (
                    <Cell key={`cell-revenue-${index}`} fill={colors[index % colors.length]} />
                ))}
            </Bar>
            <Bar dataKey="cost" shape={<CustomBar />}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-cost-${index}`} fill={colors[index % colors.length]} opacity={0.6} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
