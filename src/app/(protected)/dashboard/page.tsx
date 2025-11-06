
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  CheckCircle,
  DollarSign,
  Flame,
  Star,
  TrendingDown,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { appointments } from '@/lib/data';
import { subMonths, isWithinInterval } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { formatCurrency } from '@/lib/formatters';

const lastMonth = subMonths(new Date(), 1);
const now = new Date();

const appointmentsLastMonth = appointments.filter(a => isWithinInterval(new Date(a.date), { start: lastMonth, end: now }));
const completedLastMonth = appointmentsLastMonth.filter(a => a.status === 'Completed').length;
const cancelledLastMonth = appointmentsLastMonth.filter(a => a.status === 'Cancelled').length;

const kpiData = [
  {
    title: 'Total Properties',
    value: '1,254',
    icon: Building2,
    color: 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300',
    change: '+2.1%',
  },
  {
    title: 'Total Buyers',
    value: '821',
    icon: Users,
    color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300',
    change: '+8.5%',
  },
  {
    title: 'Properties Sold (Month)',
    value: '12',
    icon: DollarSign,
    color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
    change: '+15%',
  },
  {
    id: 'monthly-revenue',
    title: 'Monthly Revenue',
    value: 12000000,
    icon: DollarSign,
    color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    change: '+20.1%',
  },
   {
    title: 'Interested Buyers',
    value: '42',
    icon: Star,
    color: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
    change: '+10',
  },
  {
    title: 'Hot Leads',
    value: '18',
    icon: Flame,
    color: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
    change: '+3 this week',
  },
   {
    title: 'Appointments (Month)',
    value: appointmentsLastMonth.length.toString(),
    icon: CalendarDays,
    color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300',
    change: `${appointments.filter(a => a.status === 'Scheduled').length} upcoming`,
  },
   {
    title: 'Completed (Month)',
    value: completedLastMonth.toString(),
    icon: CheckCheck,
    color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    change: 'Keep it up!',
  },
    {
    title: 'Cancelled (Month)',
    value: cancelledLastMonth.toString(),
    icon: XCircle,
    color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
    change: 'Review reasons',
  },
  {
    title: 'Active Follow-ups',
    value: '102',
    icon: CalendarCheck,
    color: 'bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300',
    change: '5 due today',
  },
];

const revenueData = [
  { month: 'Jan', revenue: 4000000 },
  { month: 'Feb', revenue: 3000000 },
  { month: 'Mar', revenue: 5000000 },
  { month: 'Apr', revenue: 4500000 },
  { month: 'May', revenue: 6000000 },
  { month: 'Jun', revenue: 7200000 },
];

const buyersStatusData = [
    { name: 'Hot Lead', value: 18, fill: 'hsl(var(--chart-5))'},
    { name: 'Interested', value: 42, fill: 'hsl(var(--chart-3))'},
    { name: 'Follow Up', value: 25, fill: 'hsl(var(--chart-4))'},
    { name: 'New', value: 55, fill: 'hsl(var(--chart-2))'},
    { name: 'Cold Lead', value: 70, fill: 'hsl(var(--chart-1))'},
];
const buyersChartConfig = {
    value: { label: 'Buyers' },
    'Hot Lead': { label: 'Hot Lead', color: "hsl(var(--chart-5))"},
    'Interested': { label: 'Interested', color: "hsl(var(--chart-3))"},
    'Follow Up': { label: 'Follow Up', color: "hsl(var(--chart-4))"},
    'New': { label: 'New', color: "hsl(var(--chart-2))"},
    'Cold Lead': { label: 'Cold Lead', color: "hsl(var(--chart-1))"},
}

const agentPerformanceData = [
    { name: 'Ali Khan', sold: 5, fill: 'hsl(var(--chart-1))' },
    { name: 'Fatima Ahmed', sold: 8, fill: 'hsl(var(--chart-2))' },
    { name: 'Sana Javed', sold: 3, fill: 'hsl(var(--chart-3))' },
    { name: 'Zain Malik', sold: 6, fill: 'hsl(var(--chart-4))' },
    { name: 'Ayesha Mir', sold: 9, fill: 'hsl(var(--chart-5))' },
];
const agentChartConfig = {
    sold: { label: 'Properties Sold' }
}


export default function DashboardPage() {
  const { currency } = useCurrency();

  const getUpdatedKpi = () => {
    return kpiData.map(kpi => {
      if (kpi.id === 'monthly-revenue') {
        return { ...kpi, value: formatCurrency(kpi.value as number, currency, { notation: 'compact' }) };
      }
      return kpi;
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {getUpdatedKpi().map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
               <div className={cn("flex items-center justify-center rounded-full h-8 w-8", kpi.color)}>
                 <kpi.icon className="h-4 w-4" />
               </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={cn(
                "text-xs text-muted-foreground",
                kpi.change.startsWith('+') && "text-green-600",
                kpi.change.startsWith('-') && "text-red-600"
              )}>
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue from properties sold over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={{}} className="h-full w-full">
              <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatCurrency(value, currency, { notation: 'compact' })} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value), currency)} />}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Buyers by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-80">
            <ChartContainer config={buyersChartConfig} className="mx-auto aspect-square h-full">
              <PieChart>
                  <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={buyersStatusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Top agents by properties sold this month.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/team">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
           <CardContent className="h-80">
              <ChartContainer config={agentChartConfig}>
                <BarChart data={agentPerformanceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
                    <XAxis dataKey="sold" type="number" hide />
                    <Tooltip cursor={{fill: 'hsl(var(--accent))'}} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="sold" layout="vertical" radius={5}>
                        {agentPerformanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
