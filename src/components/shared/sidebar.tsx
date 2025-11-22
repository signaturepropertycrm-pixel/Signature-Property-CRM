
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
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
  ChevronDown,
  LineChart,
  History,
  Trash2,
  MessageSquare,
  ClipboardList,
  Badge,
  MoreHorizontal,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { buyerStatuses } from '@/lib/data';
import { useProfile } from '@/context/profile-context';
import { useUI } from '@/app/(protected)/layout';

const mainMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Editor', 'Agent'] },
  { href: '/properties', label: 'Properties', icon: <Building2 />, roles: ['Admin', 'Editor', 'Agent'], collapsible: true, links: [
      { label: 'All Properties', status: 'All', href: '/properties' },
      { label: 'Available', status: 'Available', href: '/properties?status=Available' },
      { label: 'Sold', status: 'Sold', href: '/properties?status=Sold' },
      { label: 'Recorded', status: 'Recorded', href: '/properties?status=Recorded' },
  ]},
  { href: '/buyers', label: 'Buyers', icon: <Users />, roles: ['Admin', 'Editor', 'Agent'], collapsible: true, links: [
      { label: 'All', status: 'All', href: '/buyers' },
      ...buyerStatuses.map(s => ({label: s, status: s, href: `/buyers?status=${encodeURIComponent(s)}`}))
  ]},
  { href: '/team', label: 'Team', icon: <UserCog />, roles: ['Admin'] },
  { href: '/tools', label: 'Tools', icon: <ClipboardList />, roles: ['Admin', 'Editor'], collapsible: true, links: [
      { label: 'List Generator', href: '/tools'},
      { label: 'Post Generator', href: '/tools/post-generator', isNew: true },
  ]},
  { href: '/follow-ups', label: 'Follow-ups', icon: <PhoneForwarded />, roles: ['Admin', 'Editor', 'Agent'] },
  { href: '/appointments', label: 'Appointments', icon: <Calendar />, roles: ['Admin', 'Editor', 'Agent'], collapsible: true, links: [
      { label: 'All Appointments', type: 'All', href: '/appointments' },
      { label: 'Buyer', type: 'Buyer', href: '/appointments?type=Buyer' },
      { label: 'Owner', type: 'Owner', href: '/appointments?type=Owner' },
  ]},
  { href: '/activities', label: 'Activities', icon: <History />, roles: ['Admin', 'Editor', 'Agent'] },
  { href: '/trash', label: 'Trash', icon: <Trash2 />, roles: ['Admin', 'Editor', 'Agent'] },
];


const bottomMenuItems = [
  { href: '/support', label: 'Support', icon: <MessageSquare />, roles: ['Admin', 'Editor', 'Agent'] },
  { href: '/settings', label: 'Settings', icon: <Settings />, roles: ['Admin', 'Editor', 'Agent'] },
  { href: '/upgrade', label: 'Upgrade', icon: <Rocket />, roles: ['Admin'] },
];


export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const { setOpenMobile } = useSidebar();
  const { isMoreMenuOpen, setIsMoreMenuOpen } = useUI();
  
  const [openCollapsibles, setOpenCollapsibles] = useState(() => {
    const initialState: { [key: string]: boolean } = {};
    mainMenuItems.forEach(item => {
        if (item.collapsible) {
            initialState[item.href] = pathname.startsWith(item.href);
        }
    });
    return initialState;
  });

  const toggleCollapsible = (href: string) => {
      setOpenCollapsibles(prev => ({...prev, [href]: !prev[href]}));
  }

  const mobileNavItems = [
     { href: '/team', label: 'Team', icon: <UserCog />, roles: ['Admin'] },
     { href: '/properties', label: 'Properties', icon: <Building2 />, roles: ['Admin', 'Editor', 'Agent'] },
     { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard />, roles: ['Admin', 'Editor', 'Agent'], isCenter: true },
     { href: '/buyers', label: 'Buyers', icon: <Users />, roles: ['Admin', 'Editor', 'Agent'] },
     { href: '/more', label: 'More', icon: <MoreHorizontal />, roles: ['Admin', 'Editor', 'Agent'], isSheet: true },
  ].filter(item => item.roles.includes(profile.role));

  const moreSheetItems = mainMenuItems.concat(bottomMenuItems).filter(item => 
      !['/dashboard', '/properties', '/buyers', '/team', '/support', '/settings'].includes(item.href) &&
      item.roles.includes(profile.role) &&
      (!item.collapsible || item.href === '/appointments')
  );

  const renderMenuItem = (item: any) => {
    if (!item.roles.includes(profile.role)) {
      return null;
    }

    const isActive = pathname.startsWith(item.href);

    if (item.collapsible && item.links) {
      const statusParam = searchParams.get('status');
      const typeParam = searchParams.get('type');
      
      return (
        <Collapsible key={item.href} open={openCollapsibles[item.href]} onOpenChange={() => toggleCollapsible(item.href)}>
          <SidebarMenuItem className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={isActive}
                    className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
                  >
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", openCollapsibles[item.href] && "rotate-180")} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">{item.label}</TooltipContent>
            </Tooltip>
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
          </SidebarMenuItem>
          <CollapsibleContent asChild>
            <div className="group-data-[state=expanded]:py-2 group-data-[state=collapsed]:hidden">
              <SidebarMenu className="pl-7">
                {item.links.map((link: any) => {
                  const paramToCheck = link.status ? statusParam : typeParam;
                  const valueInUrl = paramToCheck ?? (link.status ? 'All' : 'All');
                  const isSubActive = link.status === valueInUrl || link.type === valueInUrl;

                  return (
                    <SidebarMenuItem key={link.href}>
                      <Link href={link.href}>
                        <SidebarMenuButton size="sm" isActive={isSubActive} className="w-full justify-start rounded-full text-xs">
                          {link.label}
                          {link.isNew && <Badge variant="destructive" className="ml-auto scale-75">SOON</Badge>}
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.href} className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={isActive}
                className="rounded-full transition-all duration-200 hover:bg-primary/10 hover:scale-105"
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">{item.label}</TooltipContent>
        </Tooltip>
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />}
      </SidebarMenuItem>
    );
  };


  if (isMobile) {
    return (
      <TooltipProvider>
      <div className={cn("fixed bottom-0 left-0 z-40 w-full h-20 border-t bg-card/80 backdrop-blur-md transition-transform duration-300", openMobile && "-translate-y-full")}>
        <div className="grid h-full grid-cols-5 relative">
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            if (item.isSheet) {
                return (
                     <div key={item.href} className="relative flex flex-col items-center justify-center">
                        {isMoreMenuOpen && (
                            <div 
                                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                                onClick={() => setIsMoreMenuOpen(false)}
                                style={{ animation: 'fadeIn 0.3s ease-out' }}
                            />
                        )}
                        {isMoreMenuOpen && (
                            <div className="absolute bottom-full right-4 mb-4 flex flex-col items-end gap-3 z-50">
                               {moreSheetItems.map((sheetItem, index) => {
                                  const finalLabel = sheetItem.label === 'Upgrade Plan' ? 'Upgrade' : sheetItem.label;

                                  return (
                                    <Link key={sheetItem.href} href={sheetItem.href} onClick={() => setIsMoreMenuOpen(false)}>
                                        <div 
                                            className="flex items-center gap-3"
                                            style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
                                        >
                                            <span className="font-semibold text-foreground dark:text-white shadow-lg">{finalLabel}</span>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-white shadow-lg transition-all duration-300 hover:scale-110">
                                                {React.cloneElement(sheetItem.icon, { className: 'h-6 w-6' })}
                                            </div>
                                        </div>
                                    </Link>
                                  )
                               })}
                            </div>
                        )}
                        <button 
                            onClick={() => setIsMoreMenuOpen(prev => !prev)}
                            className={cn('flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-primary z-50')}
                        >
                            {isMoreMenuOpen ? <X className="h-5 w-5" /> : React.cloneElement(item.icon, { className: 'h-5 w-5' })}
                            <span>{item.label}</span>
                        </button>
                    </div>
                )
            }
            if (item.isCenter) {
                return (
                    <div key={item.href} className="relative flex items-center justify-center">
                        <Link href={item.href}>
                             <div className={cn(
                                'absolute -top-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 left-1/2 -translate-x-1/2',
                                'bg-gradient-to-br from-primary to-blue-500',
                                isActive && 'ring-4 ring-primary/30'
                             )}>
                                {React.cloneElement(item.icon, { className: 'h-7 w-7' })}
                            </div>
                        </Link>
                    </div>
                )
            }
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    )}
                >
                    {React.cloneElement(item.icon, { className: 'h-5 w-5' })}
                    <span>{item.label}</span>
                </Link>
            )
          })}
        </div>
      </div>
      </TooltipProvider>
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
            {mainMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
