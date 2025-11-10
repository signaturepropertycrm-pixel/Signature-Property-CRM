
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

import { useState, useEffect, useMemo } from 'react';
import type { Property, Buyer, Appointment, BuyerStatus, PropertyType } from '@/lib/types';
import { Building2, Users, Flame, Calendar, CheckCircle, HandCoins } from 'lucide-react';
import { subDays, format, parseISO } from 'date-fns';

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  '#FF8042',
  '#00C49F',
  '#FFBB28',
  '#0088FE',
];

const KpiCard = ({ title, value, icon: Icon }: { title: string; value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AnalyticsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const savedProperties = localStorage.getItem('properties');
    if (savedProperties) setProperties(JSON.parse(savedProperties));

    const savedBuyers = localStorage.getItem('buyers');
    if (savedBuyers) setBuyers(JSON.parse(savedBuyers));
    
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
  }, []);

  const analyticsData = useMemo(() => {
    // Properties Analytics
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.status === 'Available').length;
    const soldProperties = properties.filter(p => p.status === 'Sold').length;
    const propertyStatusData = [
      { name: 'Available', value: availableProperties, fill: "hsl(var(--chart-2))" },
      { name: 'Sold', value: soldProperties, fill: "hsl(var(--chart-3))" },
    ];
    
    const propertyTypesCount = properties.reduce((acc, p) => {
        const type = p.property_type as PropertyType;
        if (type) {
           acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
    }, {} as Record<PropertyType, number>);

    const propertyTypesData = Object.entries(propertyTypesCount).map(([name, value]) => ({ name, value }));


    // Buyers Analytics
    const totalBuyers = buyers.length;
    const hotLeads = buyers.filter(b => b.status === 'Hot Lead').length;
    
    const buyerStatusCounts = buyers.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
    }, {} as Record<BuyerStatus, number>);

    const buyerStatusData = Object.entries(buyerStatusCounts).map(([name, value]) => ({ name, value }));

    // Appointments Analytics
    const totalAppointments = appointments.length;
    const last30Days = subDays(new Date(), 30);
    const appointmentsLast30Days = appointments.filter(a => parseISO(a.date) >= last30Days);

    const appointmentsByDate = appointmentsLast30Days.reduce((acc, a) => {
        const date = format(parseISO(a.date), 'MMM dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const appointmentTimelineData = Object.entries(appointmentsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
      totalProperties,
      availableProperties,
      soldProperties,
      propertyStatusData,
      propertyTypesData,
      totalBuyers,
      hotLeads,
      buyerStatusData,
      totalAppointments,
      appointmentTimelineData,
    };
  }, [properties, buyers, appointments]);
  
  const buyerChartConfig = useMemo(() => {
     const config: any = { value: { label: 'Buyers' } };
      analyticsData.buyerStatusData.forEach((item, index) => {
          config[item.name] = { label: item.name, color: COLORS[index % COLORS.length] };
      });
      return config;
  }, [analyticsData.buyerStatusData]);
  
  const propertyTypeChartConfig = useMemo(() => {
     const config: any = { value: { label: 'Properties' } };
      analyticsData.propertyTypesData.forEach((item, index) => {
          config[item.name] = { label: item.name, color: COLORS[index % COLORS.length] };
      });
      return config;
  }, [analyticsData.propertyTypesData]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Analytics Overview</h1>
        <p className="text-muted-foreground">A detailed look at your application's progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard title="Total Properties" value={analyticsData.totalProperties} icon={Building2} />
          <KpiCard title="Available" value={analyticsData.availableProperties} icon={CheckCircle} />
          <KpiCard title="Sold" value={analyticsData.soldProperties} icon={HandCoins} />
          <KpiCard title="Total Buyers" value={analyticsData.totalBuyers} icon={Users} />
          <KpiCard title="Hot Leads" value={analyticsData.hotLeads} icon={Flame} />
          <KpiCard title="Total Appointments" value={analyticsData.totalAppointments} icon={Calendar} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Properties by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                 <ChartContainer config={{}} className="h-full w-full">
                    <BarChart data={analyticsData.propertyStatusData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} />
                        <XAxis type="number" hide />
                        <Tooltip cursor={{fill: 'hsl(var(--accent))'}} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="value" layout="vertical" radius={5} barSize={40}>
                           {analyticsData.propertyStatusData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Appointments Over Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                 <ChartContainer config={{}} className="h-full w-full">
                    <LineChart data={analyticsData.appointmentTimelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} angle={-45} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="count" name="Appointments" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2">
           <Card>
                <CardHeader>
                    <CardTitle>Properties by Type</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                    <ChartContainer config={propertyTypeChartConfig} className="mx-auto aspect-square h-full">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={analyticsData.propertyTypesData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {analyticsData.propertyTypesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
           </Card>
           <Card>
                <CardHeader>
                    <CardTitle>Buyers by Status</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                   <ChartContainer config={buyerChartConfig} className="mx-auto aspect-square h-full">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={analyticsData.buyerStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                {analyticsData.buyerStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
           </Card>
       </div>

    </div>
  );
}
