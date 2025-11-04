import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/sidebar';
import { AppHeader } from '@/components/shared/header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background/95">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
