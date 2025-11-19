
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/lib/types';
import { Users } from 'lucide-react';
import { useMemo } from 'react';

const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const demoData = [
  { name: 'Ali', value: 8 },
  { name: 'Fatima', value: 12 },
  { name: 'Admin', value: 5 },
];


export const TeamPerformanceChart = ({ teamMembers }: { teamMembers: User[] }) => {

  const data = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) {
      return demoData;
    }

    const realData = teamMembers
      .filter(member => member.role === 'Agent' || member.role === 'Admin')
      .map(member => ({
        name: member.name.split(' ')[0], // Use first name
        value: member.stats?.propertiesSold || 0,
      }));
    
    const hasSales = realData.some(d => d.value > 0);

    return hasSales ? realData.filter(d => d.value > 0) : demoData;

  }, [teamMembers]);

  return (
    <Card className="shadow-lg col-span-1">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-bold flex items-center gap-2">
            <Users />
            Team Performance
        </CardTitle>
        <CardDescription>Properties sold by each agent.</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              className="text-xs font-medium focus:outline-none"
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
                      <p className="font-bold">{`${payload[0].name}: ${payload[0].value} sold`}</p>
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
                formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{value}</span>
                )}
             />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
