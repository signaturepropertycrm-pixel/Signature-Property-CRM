

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  PhoneForwarded,
  Calendar,
  Settings,
  Rocket,
  Home,
  LogOut,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/follow-ups', label: 'Follow-ups', icon: PhoneForwarded },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
];

const bottomMenuItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/upgrade', label: 'Upgrade Plan', icon: Rocket },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-card/80 backdrop-blur-md">
        <div className="grid h-16 grid-cols-5">
          {menuItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="hidden md:flex flex-col bg-card/60 backdrop-blur-lg border-r-0"
      >
        <SidebarHeader>
          <SidebarMenuButton asChild size="lg" className="justify-start my-2">
            <Link href="/dashboard">
                <div className="flex items-center gap-2">
                    <Home className="text-primary size-8" />
                    <span className="font-bold text-xl font-headline text-primary">
                        Signature
                    </span>
                </div>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent className="flex-1">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href} className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton
                            isActive={pathname === item.href}
                            className="rounded-full"
                        >
                            <item.icon />
                            <span className="flex-1 truncate">{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
                 {pathname === item.href && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.map((item) => (
               <SidebarMenuItem key={item.href} className="relative">
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Link href={item.href} passHref>
                        <SidebarMenuButton isActive={pathname === item.href} className="rounded-full">
                            <item.icon />
                            <span className="flex-1 truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                   </TooltipTrigger>
                   <TooltipContent side="right" align="center">{item.label}</TooltipContent>
                 </Tooltip>
                  {pathname === item.href && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
                <Link href="/login" passHref>
                  <SidebarMenuButton size="lg" className="justify-start">
                      <LogOut />
                      <span className="flex-1 truncate">Logout</span>
                  </SidebarMenuButton>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">Logout</TooltipContent>
          </Tooltip>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
