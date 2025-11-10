
'use client';

import { ListGeneratorTool } from '@/components/list-generator-tool';
import { properties as initialProperties } from '@/lib/data';
import { Property } from '@/lib/types';
import { useEffect, useState } from 'react';

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

      <ListGeneratorTool allProperties={properties} />
    </div>
  );
}
