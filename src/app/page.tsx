
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Check, Building, Users, LineChart, Star, Moon, Sun, Home, LayoutDashboard, GanttChartSquare, ClipboardList, PhoneCall, Workflow, Sparkles, AlertTriangle, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import TrueFocus from '@/components/true-focus';
import { InfiniteScroller } from '@/components/infinite-scroller';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import DotGrid from '@/components/dot-grid';
import { motion, useAnimation, useInView } from "framer-motion"
import { useUser } from '@/firebase/auth/use-user';


const plans = [
    {
        name: 'Basic',
        price: 'RS 5,000',
        period: '/month',
        description: 'Ideal for small agencies getting started.',
        features: [
            'Up to 500 Properties & Buyers',
            'Up to 3 Team Members',
            'Core CRM Features',
            'Reports & Analytics',
        ],
        cta: 'Choose Basic',
        isPopular: false,
    },
    {
        name: 'Standard',
        price: 'RS 15,000',
        period: '/month',
        description: 'For growing agencies that need more power.',
        features: [
            'Up to 2,500 Properties & Buyers',
            'Up to 10 Team Members',
            'All Basic Features',
            'Advanced Tools & Reports',
        ],
        cta: 'Choose Standard',
        isPopular: true,
    },
    {
        name: 'Premium',
        price: 'Contact Us',
        period: '',
        description: 'For large teams requiring unlimited scale.',
        features: [
            'Unlimited Properties & Buyers',
            'Unlimited Team Members',
            'All Standard Features',
            'Dedicated Support',
        ],
        cta: 'Contact Sales',
        isPopular: false,
    },
];

const coreFeatures = [
    {
        icon: <Building className="h-8 w-8" />,
        title: 'Property & Buyer Management',
        description: 'Centralize all your listings and buyer leads. Track every detail from initial contact to deal closure with an auto-generated serial number system.',
        image: '/images/feature-properties.png'
    },
    {
        icon: <Workflow className="h-8 w-8" />,
        title: 'Team Collaboration & Roles',
        description: 'Invite agents, assign roles (Admin/Agent), and manage permissions seamlessly. Assign leads and track performance across your entire agency.',
        image: '/images/feature-team.png'
    },
    {
        icon: <GanttChartSquare className="h-8 w-8" />,
        title: 'Appointment & Follow-up System',
        description: 'Schedule appointments, set reminders for follow-ups, and manage your calendar without missing a single opportunity.',
        image: '/images/feature-appointments.png'
    },
    {
        icon: <Sparkles className="h-8 w-8" />,
        title: 'Powerful Productivity Tools',
        description: 'Generate formatted property lists for dealers, find matching buyers by budget, and automatically create social media posts to boost your marketing.',
        image: '/images/feature-tools.png'
    },
    {
        icon: <LineChart className="h-8 w-8" />,
        title: 'Insightful Analytics & Reports',
        description: 'Get a clear view of your agency\'s performance. Track revenue, lead growth, and team activity with beautiful charts and downloadable reports.',
        image: '/images/feature-analytics.png'
    },
     {
        icon: <PhoneCall className="h-8 w-8" />,
        title: 'Lead Assignment & Tracking',
        description: 'Admins can assign buyer leads to specific agents, enabling focused follow-ups and clear accountability within the team.',
        image: '/images/feature-assign.png'
    },
];

const testimonials = [
  {
    name: 'Ali Khan',
    agency: 'Khan Properties',
    quote: 'Signature Property CRM has transformed how we manage our leads. Our closing rate has increased by 30%!',
    avatar: 'https://images.unsplash.com/photo-1590086782792-42dd2350140d?w=50&h=50&fit=crop&crop=entropy'
  },
  {
    name: 'Fatima Ahmed',
    agency: 'Lahore Real Estate',
    quote: 'The best part is the team collaboration. My agents and I are always in sync. Highly recommended!',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=entropy'
  },
   {
    name: 'Saad Malik',
    agency: 'Capital Homes',
    quote: 'Finally, a CRM that understands the Pakistani real estate market. The List Generator tool is a game-changer for dealing with other agents.',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=50&h=50&fit=crop&crop=entropy'
  },
];

const FeatureCard = ({ feature, index }: { feature: (typeof coreFeatures)[0], index: number }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-2xl border bg-card/50 p-6 flex flex-col items-start gap-4 hover:shadow-lg transition-shadow"
        >
            <div className="p-3 bg-primary/10 text-primary rounded-lg">{feature.icon}</div>
            <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
            <p className="text-muted-foreground flex-1">{feature.description}</p>
            <div className="w-full aspect-video rounded-lg overflow-hidden border mt-4">
                 <Image src={feature.image} alt={feature.title} width={1280} height={720} className="w-full h-full object-cover" />
            </div>
        </motion.div>
    );
};


export default function LandingPage() {
  const { setTheme, theme } = useTheme();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const { user, isUserLoading } = useUser();
  
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="bg-background text-foreground animate-fade-in">
        <header className={cn("sticky top-0 z-50 w-full border-b transition-colors duration-300", headerScrolled ? "bg-card/80 backdrop-blur-lg border-border" : "bg-transparent border-transparent")}>
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline text-primary">
                    <Building />
                    <span>S.P CRM</span>
                </Link>
                <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                    <Link href="#features" className="transition-colors hover:text-primary">Features</Link>
                    <Link href="#pricing" className="transition-colors hover:text-primary">Pricing</Link>
                    <Link href="#testimonials" className="transition-colors hover:text-primary">Testimonials</Link>
                </nav>
                <div className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-full">
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    {isUserLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : user ? (
                        <Button asChild>
                            <Link href="/overview">Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild className="glowing-btn">
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 text-center overflow-hidden">
             <DotGrid
                className="absolute inset-0 -z-10"
                dotSize={2}
                gap={25}
                baseColor={theme === 'dark' ? '#1E293B' : '#E0E7FF'}
                activeColor={theme === 'dark' ? '#38BDF8' : '#3B82F6'}
             />
            <div className="container mx-auto px-4 animate-fade-in-up">
                <Badge variant="outline" className="mb-4 border-primary/50 text-primary">The Operating System for Modern Real Estate Agencies</Badge>
                <div className="min-h-[140px] md:min-h-[100px] flex items-center justify-center">
                   <TrueFocus 
                        sentence="Close More Deals, Faster" 
                        separator=","
                        borderColor="hsl(var(--primary))"
                        glowColor="hsl(var(--primary))"
                    />
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    Signature Property CRM is the all-in-one platform built for Pakistani real estate agencies to streamline operations, manage leads, and accelerate growth.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Button size="lg" asChild className="glowing-btn text-lg h-14 px-8">
                        <Link href="/signup">Start Your Free 30-Day Trial</Link>
                    </Button>
                </div>
            </div>
        </section>
        
        {/* Social Proof */}
        <section className="py-12">
            <p className="text-center text-sm font-semibold text-muted-foreground mb-4">TRUSTED BY TOP AGENCIES IN PAKISTAN</p>
            <InfiniteScroller />
        </section>

        {/* Problem/Solution */}
        <section className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">Escape Manual Work, Embrace Technology</h2>
                    <p className="mt-4 text-muted-foreground">
                        Scattered leads, forgotten follow-ups, and a lack of team visibility are things of the past.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <Card className="border-red-500/30 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-red-600"><AlertTriangle /> Without S.P CRM</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-muted-foreground">
                            <p className="flex items-center gap-2"><X className="text-red-500 flex-shrink-0" /> Leads are scattered in registers and Excel sheets.</p>
                            <p className="flex items-center gap-2"><X className="text-red-500 flex-shrink-0" /> Important follow-ups are frequently missed.</p>
                            <p className="flex items-center gap-2"><X className="text-red-500 flex-shrink-0" /> No clear visibility into team performance.</p>
                            <p className="flex items-center gap-2"><X className="text-red-500 flex-shrink-0" /> Sharing property lists with dealers takes hours.</p>
                            <p className="flex items-center gap-2"><X className="text-red-500 flex-shrink-0" /> True agency performance remains a mystery.</p>
                        </CardContent>
                    </Card>
                     <Card className="border-green-500/30 bg-green-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-green-600"><Check className="bg-green-600 text-white rounded-full p-1" /> With S.P CRM</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-foreground">
                            <p className="flex items-center gap-2"><Check className="text-green-500 flex-shrink-0" /> All properties and buyers on a central dashboard.</p>
                            <p className="flex items-center gap-2"><Check className="text-green-500 flex-shrink-0" /> Automatic reminders for appointments and follow-ups.</p>
                            <p className="flex items-center gap-2"><Check className="text-green-500 flex-shrink-0" /> Live view of each agent's performance for admins.</p>
                            <p className="flex items-center gap-2"><Check className="text-green-500 flex-shrink-0" /> Generate professional property lists in just two clicks.</p>
                            <p className="flex items-center gap-2"><Check className="text-green-500 flex-shrink-0" /> Get reports on revenue, lead growth, and sold properties.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">Features Built For Your Agency</h2>
                    <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                        Every tool is designed to make your daily tasks easier and faster.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coreFeatures.map((feature, index) => (
                       <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-24">
            <div className="container mx-auto px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">Simple, Transparent Pricing</h2>
                    <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                       Choose the plan that fits your agency's size and needs.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`flex flex-col h-full ${plan.isPopular ? 'border-primary border-2 shadow-primary/20' : ''}`}>
                            <CardHeader>
                                <CardTitle className="font-headline">{plan.name}</CardTitle>
                                <div className="text-4xl font-extrabold my-4">
                                    {plan.price}
                                    <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <Check className="h-5 w-5 text-green-500" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className={`w-full ${plan.isPopular ? 'glowing-btn' : ''}`} variant={plan.isPopular ? 'default' : 'outline'} asChild>
                                    <Link href="/signup">{plan.cta}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-muted/30">
            <div className="container mx-auto px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">Trusted by Agencies Across Pakistan</h2>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {testimonials.map(testimonial => (
                        <Card key={testimonial.name} className="flex flex-col">
                            <CardContent className="pt-6">
                                <p className="italic text-muted-foreground">"{testimonial.quote.replace('SignatureCRM', 'Signature Property CRM')}"</p>
                            </CardContent>
                            <CardFooter className="mt-auto flex items-center gap-4">
                                <Image src={testimonial.avatar} alt={testimonial.name} width={40} height={40} className="rounded-full" />
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.agency}</p>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold font-headline md:text-4xl">Ready to Grow Your Business?</h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                    Join dozens of agencies who trust Signature Property CRM to streamline their operations.
                </p>
                <div className="mt-8">
                     <Button size="lg" asChild className="glowing-btn text-lg h-14 px-8">
                        <Link href="/signup">Start Your Free Trial</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

        <footer className="border-t">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Signature Property CRM. All rights reserved.</p>
                <div className="flex items-center gap-4 text-sm">
                    <Link href="#" className="transition-colors hover:text-primary">Terms of Service</Link>
                    <Link href="#" className="transition-colors hover:text-primary">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    </div>
  );
}
