'use client';

import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, ClipboardList, Rocket } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const tools = [
    {
        title: 'List Generator',
        description: 'Generate a shareable, formatted list of available properties for other dealers and clients.',
        href: '/tools/list-generator',
        icon: <ClipboardList className="h-8 w-8 text-primary" />,
    },
    {
        title: 'Post Generator',
        description: 'Automatically create engaging social media posts for your properties. (Coming Soon)',
        href: '/tools/post-generator',
        icon: <Rocket className="h-8 w-8 text-primary" />,
    }
]

export default function ToolsPage() {

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Tools
        </h1>
        <p className="text-muted-foreground">
          A collection of utilities to streamline your daily real estate tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
            <Card key={tool.title} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-bold font-headline">{tool.title}</CardTitle>
                        {tool.icon}
                    </div>
                    <CardDescription className="pt-2">{tool.description}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto">
                    <Button asChild className="w-full">
                        <Link href={tool.href}>
                            Open Tool <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </div>

    </div>
  );
}
