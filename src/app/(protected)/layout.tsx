
'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/shared/sidebar';
import { AppHeader } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddPropertyDialog } from '@/components/add-property-dialog';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 page-transition">
            {children}
          </main>
        </div>
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50">
            <Button onClick={() => setIsAddPropertyOpen(true) } className="rounded-full w-14 h-14 shadow-lg glowing-btn" size="icon">
                <PlusCircle className="h-6 w-6" />
                <span className="sr-only">Add Property</span>
            </Button>
        </div>
        <AddPropertyDialog 
            isOpen={isAddPropertyOpen}
            setIsOpen={setIsAddPropertyOpen}
            propertyToEdit={null} // This FAB always adds a new property
        />
      </div>
    </SidebarProvider>
  );
}
