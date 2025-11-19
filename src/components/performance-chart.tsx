
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

const data = [
  { year: '2019', revenue: 25, cost: -12 },
  { year: '2020', revenue: 30, cost: -18 },
  { year: '2021', revenue: 35, cost: -10 },
  { year: '2022', revenue: 38, cost: -15 },
  { year: '2023', revenue: 42, cost: -11 },
];

const colors = [
    '#2563eb',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
];

const CustomTick = (props: any) => {
  const { x, y, payload, index } = props;
  const radius = 16;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={0} r={radius} fill={colors[index % colors.length]} />
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="middle"
        fill="#fff"
        fontSize="12px"
        fontWeight="bold"
      >
        {payload.value}
      </text>
    </g>
  );
};


const CustomBar = (props: any) => {
    const { x, y, width, height, value, fill } = props;
    const isPositive = value >= 0;

    // Render nothing if value is 0
    if (value === 0) return null;
  
    if (isPositive) {
      // Positive bar (Revenue)
      return <rect x={x} y={y} width={width} height={height} fill={fill} />;
    } else {
      // Negative bar (Cost)
      return <rect x={x} y={y} width={width} height={-height} fill={fill} />;
    }
};

export const PerformanceChart = () => {
  return (
    <Card className="shadow-lg col-span-1 lg:col-span-2">
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
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 30,
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
                            {revenue && <p className="text-green-500">{`Revenue: ${revenue.value}%`}</p>}
                            {cost && <p className="text-red-500">{`Cost: ${-cost.value}%`}</p>}
                        </div>
                    );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#a1a1aa" strokeWidth={2} />
            <Bar dataKey="revenue">
               {data.map((entry, index) => (
                    <Cell key={`cell-revenue-${index}`} fill={colors[index % colors.length]} />
                ))}
            </Bar>
            <Bar dataKey="cost" shape={<CustomBar />}>
                {data.map((entry, index) => (
                    <Cell key={`cell-cost-${index}`} fill={colors[index % colors.length]} opacity={0.6} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
