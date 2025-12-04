
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Check, Building, Users, LineChart, Star, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import TrueFocus from '@/components/true-focus';

// Placeholder data - replace with real data or fetch from an API
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

const features = [
    {
        icon: <Building className="h-10 w-10 text-primary" />,
        title: 'Property Management',
        description: 'Easily add, track, and manage all your property listings, from available to sold, in one central place.',
    },
    {
        icon: <Users className="h-10 w-10 text-primary" />,
        title: 'Buyer Lead Tracking',
        description: 'Capture and manage buyer details, their requirements, budget, and status to close deals faster.',
    },
    {
        icon: <LineChart className="h-10 w-10 text-primary" />,
        title: 'Performance Analytics',
        description: 'Get a clear view of your agency\'s performance with insightful reports on sales, revenue, and team activity.',
    }
];

const testimonials = [
  {
    name: 'Ali Khan',
    agency: 'Khan Properties',
    quote: 'SignatureCRM has transformed how we manage our leads. Our closing rate has increased by 30%!',
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


export default function LandingPage() {
  const { setTheme, theme } = useTheme();
  const [headerScrolled, setHeaderScrolled] = useState(false);

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
                    <span>SignatureCRM</span>
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
                     <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="glowing-btn">
                        <Link href="/signup">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80"></div>
            <div className="container relative mx-auto px-4 animate-fade-in-up">
                <Badge variant="outline" className="mb-4 border-primary/50 text-primary">The Ultimate Real Estate CRM</Badge>
                <div className="min-h-[140px] md:min-h-[100px] flex items-center justify-center">
                   <TrueFocus 
                        sentence="Manage Properties Track Buyers Boost Performance" 
                        borderColor="hsl(var(--primary))"
                        glowColor="hsl(var(--primary))"
                    />
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    SignatureCRM is the all-in-one platform built for Pakistani real estate agencies to streamline operations and close more deals, faster.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Button size="lg" asChild className="glowing-btn text-lg h-14 px-8">
                        <Link href="/signup">Get Started for Free</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Dashboard Preview */}
        <section className="container mx-auto px-4 -mt-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-2xl shadow-2xl shadow-primary/10 border-4 border-primary/20 bg-background/50 p-2">
                <Image
                    src="https://picsum.photos/seed/crm-dashboard/1200/800"
                    alt="SignatureCRM Dashboard"
                    width={1200}
                    height={800}
                    className="rounded-lg"
                    data-ai-hint="dashboard ui"
                />
            </div>
        </section>


        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">Everything Your Agency Needs</h2>
                    <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                        From lead management to performance tracking, we've got you covered.
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {features.map((feature, index) => (
                        <div key={feature.title} className="text-center p-8 border rounded-2xl bg-card/50 hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
                            {feature.icon}
                            <h3 className="mt-6 text-xl font-bold font-headline">{feature.title}</h3>
                            <p className="mt-2 text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-24 bg-muted/30">
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
        <section id="testimonials" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">Trusted by Agencies Across Pakistan</h2>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {testimonials.map(testimonial => (
                        <Card key={testimonial.name} className="flex flex-col">
                            <CardContent className="pt-6">
                                <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
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
        <section className="py-20 text-center bg-muted/30">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold font-headline md:text-4xl">Ready to Grow Your Business?</h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                    Join dozens of agencies who trust SignatureCRM to streamline their operations.
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
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} SignatureCRM. All rights reserved.</p>
                <div className="flex items-center gap-4 text-sm">
                    <Link href="#" className="transition-colors hover:text-primary">Terms of Service</Link>
                    <Link href="#" className="transition-colors hover:text-primary">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    </div>
  );
}
