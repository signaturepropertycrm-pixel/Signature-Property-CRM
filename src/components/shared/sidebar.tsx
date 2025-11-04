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
  LineChart,
  Settings,
  Rocket,
  Home,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/follow-ups', label: 'Follow-ups', icon: PhoneForwarded },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
];

const adminAvatar = PlaceHolderImages.find(img => img.id === 'avatar-admin');

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton asChild size="lg" className="justify-start">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="text-primary size-7" />
            <span className="font-bold text-lg font-headline text-primary">
              SignatureCRM
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/upgrade'}
              tooltip={{ children: 'Upgrade Plan', side: 'right' }}
            >
              <Link href="/upgrade">
                <Rocket />
                <span>Upgrade Plan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/settings'}
              tooltip={{ children: 'Settings', side: 'right' }}
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenuButton asChild size="lg" className="justify-start">
            <Link href="/login" className="flex items-center gap-2">
                <Avatar className="size-8">
                    {adminAvatar && <AvatarImage src={adminAvatar.imageUrl} data-ai-hint={adminAvatar.imageHint} />}
                    <AvatarFallback>DA</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">Demo Admin</span>
                    <span className="text-xs text-muted-foreground">demo_admin@signaturecrm.test</span>
                </div>
                <LogOut className="ml-auto size-4" />
            </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
