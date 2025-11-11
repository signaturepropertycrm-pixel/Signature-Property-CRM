
'use client';

import { ListGeneratorTool } from '@/components/list-generator-tool';
import { properties as initialProperties } from '@/lib/data';
import { Property } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DealTrackerTool } from '@/components/deal-tracker-tool';
import { List, Calculator } from 'lucide-react';


export default function ToolsPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const savedProperties = localStorage.getItem('properties');
    if (savedProperties) {
      setProperties(JSON.parse(savedProperties));
    } else {
      setProperties(initialProperties);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Tools
        </h1>
        <p className="text-muted-foreground">
          Utilities to streamline your daily tasks.
        </p>
      </div>

       <Tabs defaultValue="list-generator">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list-generator">
            <List className="mr-2 h-4 w-4" />
            List Generator
            </TabsTrigger>
          <TabsTrigger value="deal-tracker">
            <Calculator className="mr-2 h-4 w-4" />
            Deal Tracker
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list-generator">
          <ListGeneratorTool allProperties={properties} />
        </TabsContent>
        <TabsContent value="deal-tracker">
          <DealTrackerTool />
        </TabsContent>
      </Tabs>
    </div>
  );
}
